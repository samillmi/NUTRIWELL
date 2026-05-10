"""
Python FastAPI Microservice — YOLOv8 Food Detection + Nutrition Lookup

Endpoints:
  POST /scan     — Upload food image, run YOLOv8, return detections + nutrition
  POST /chatbot  — LLM-based dietary chatbot
  GET  /health   — Liveness check

Install deps:
  pip install fastapi uvicorn ultralytics pillow python-multipart \
              httpx openai python-dotenv
"""

import io
import os
import time
import base64
import logging
from contextlib import asynccontextmanager
from typing import Optional

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO
from openai import OpenAI

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

# ─── Config ──────────────────────────────────────────────────────────────────

MODEL_PATH        = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")   # auto-downloads on first run
CONFIDENCE_THRESH = float(os.getenv("YOLO_CONFIDENCE", "0.40"))
API_KEY           = os.getenv("AI_SERVICE_API_KEY", "")
NUTRITIONIX_APP_ID  = os.getenv("NUTRITIONIX_APP_ID", "")
NUTRITIONIX_APP_KEY = os.getenv("NUTRITIONIX_APP_KEY", "")
OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY", "")

# ─── Global model handle (loaded once at startup) ─────────────────────────────

yolo_model: Optional[YOLO] = None
openai_client: Optional[OpenAI] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global yolo_model, openai_client
    logger.info("Loading YOLOv8 model from: %s", MODEL_PATH)
    yolo_model = YOLO(MODEL_PATH)
    logger.info("YOLOv8 model loaded. Classes: %d", len(yolo_model.names))

    if OPENAI_API_KEY:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialised.")

    yield

    logger.info("Shutting down AI service.")


# ─── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Dietary Platform AI Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Tighten in production to Node backend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Auth dependency ──────────────────────────────────────────────────────────

async def verify_api_key(x_api_key: str = Header(...)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API key.")


# ─── Pydantic models ──────────────────────────────────────────────────────────

class NutritionInfo(BaseModel):
    calories: float = 0
    protein_g: float = 0
    carbohydrate_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class DetectedItem(BaseModel):
    label: str
    confidence: float
    bounding_box: BoundingBox
    estimated_grams: float = Field(default=100.0)
    nutrition: NutritionInfo = Field(default_factory=NutritionInfo)
    nutrition_source: str = "estimated"


class ScanResponse(BaseModel):
    success: bool
    model_version: str
    processing_time_ms: int
    annotated_image_base64: Optional[str]
    detections: list[DetectedItem]
    totals: NutritionInfo


class ChatMessage(BaseModel):
    role: str               # "user" or "assistant"
    content: str


class ChatbotRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    context: dict = {}


class ChatbotResponse(BaseModel):
    reply: str
    tokens_used: Optional[int]


# ─── Nutrition lookup via Nutritionix ─────────────────────────────────────────

NUTRITION_CACHE: dict[str, NutritionInfo] = {}  # simple in-process cache

async def fetch_nutrition(food_label: str, grams: float = 100.0) -> tuple[NutritionInfo, str]:
    """
    Query Nutritionix Natural Language API for nutrition data.
    Falls back to zero-values if service is unavailable.
    """
    cache_key = f"{food_label.lower()}_{int(grams)}"
    if cache_key in NUTRITION_CACHE:
        return NUTRITION_CACHE[cache_key], "cache"

    if not NUTRITIONIX_APP_ID:
        return NutritionInfo(), "estimated"

    query = f"{grams} grams of {food_label}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                "https://trackapi.nutritionix.com/v2/natural/nutrients",
                headers={
                    "x-app-id":  NUTRITIONIX_APP_ID,
                    "x-app-key": NUTRITIONIX_APP_KEY,
                    "Content-Type": "application/json",
                },
                json={"query": query},
            )
            resp.raise_for_status()
            data = resp.json()
            food = data["foods"][0]
            info = NutritionInfo(
                calories      = food.get("nf_calories", 0),
                protein_g     = food.get("nf_protein", 0),
                carbohydrate_g= food.get("nf_total_carbohydrate", 0),
                fat_g         = food.get("nf_total_fat", 0),
                fiber_g       = food.get("nf_dietary_fiber", 0),
            )
            NUTRITION_CACHE[cache_key] = info
            return info, "nutritionix"
    except Exception as e:
        logger.warning("Nutritionix lookup failed for '%s': %s", food_label, e)
        return NutritionInfo(), "estimated"


# ─── POST /scan ───────────────────────────────────────────────────────────────

@app.post("/scan", response_model=ScanResponse, dependencies=[Depends(verify_api_key)])
async def scan_food(file: UploadFile = File(...)):
    """
    Accepts a food image, runs YOLOv8 object detection, enriches detections
    with nutrition data from Nutritionix, and returns structured results plus
    a base64-encoded annotated image.
    """
    start_ms = int(time.time() * 1000)

    # ── Validate image ──────────────────────────────────────────────────────
    contents = await file.read()
    try:
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

    # ── Run YOLOv8 inference ────────────────────────────────────────────────
    results = yolo_model.predict(
        source=pil_image,
        conf=CONFIDENCE_THRESH,
        verbose=False,
    )
    result = results[0]  # single image

    # ── Annotated image → base64 ────────────────────────────────────────────
    annotated_array = result.plot()          # numpy array (BGR)
    annotated_pil   = Image.fromarray(annotated_array[..., ::-1])  # BGR → RGB
    buf = io.BytesIO()
    annotated_pil.save(buf, format="JPEG", quality=85)
    annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    # ── Build detection list ────────────────────────────────────────────────
    detections: list[DetectedItem] = []

    for box in result.boxes:
        cls_idx     = int(box.cls[0])
        label       = yolo_model.names[cls_idx]
        confidence  = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()

        # Rough portion estimate: bounding box area → grams (domain heuristic)
        box_area     = (x2 - x1) * (y2 - y1)
        image_area   = pil_image.width * pil_image.height
        area_ratio   = box_area / image_area
        est_grams    = max(50.0, round(area_ratio * 800, 1))  # clamp minimum 50g

        nutrition, source = await fetch_nutrition(label, est_grams)

        detections.append(
            DetectedItem(
                label          = label,
                confidence     = round(confidence, 4),
                bounding_box   = BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                estimated_grams= est_grams,
                nutrition      = nutrition,
                nutrition_source=source,
            )
        )

    # ── Aggregate totals ────────────────────────────────────────────────────
    totals = NutritionInfo(
        calories      = sum(d.nutrition.calories       for d in detections),
        protein_g     = sum(d.nutrition.protein_g      for d in detections),
        carbohydrate_g= sum(d.nutrition.carbohydrate_g for d in detections),
        fat_g         = sum(d.nutrition.fat_g          for d in detections),
        fiber_g       = sum(d.nutrition.fiber_g        for d in detections),
    )

    processing_time_ms = int(time.time() * 1000) - start_ms

    return ScanResponse(
        success                = True,
        model_version          = "yolov8n",
        processing_time_ms     = processing_time_ms,
        annotated_image_base64 = annotated_b64,
        detections             = detections,
        totals                 = totals,
    )


# ─── POST /chatbot ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are NutriBot, an expert AI dietary assistant integrated into a 
medical nutrition platform. You provide evidence-based dietary advice, meal suggestions, 
and answer questions about food and nutrition. Always be supportive, empathetic, and 
safety-conscious. If a user describes a medical emergency or serious condition, 
always advise them to consult their doctor immediately. Never give medical diagnoses.
Keep responses concise (under 200 words) unless detailed explanations are explicitly requested."""


@app.post("/chatbot", response_model=ChatbotResponse, dependencies=[Depends(verify_api_key)])
async def chatbot(request: ChatbotRequest):
    if not openai_client:
        reply = "I'm currently running in demo mode because the OpenAI API key is not configured. I can tell you that a balanced diet with enough protein and vegetables is always a good choice! (Please set OPENAI_API_KEY in the .env file to enable full AI chat)."
        return ChatbotResponse(reply=reply, tokens_used=0)

    # Build context-aware system message
    ctx = request.context
    context_block = ""
    if ctx:
        goals   = ctx.get("dietaryGoals", {})
        allergies= ctx.get("allergies", [])
        context_block = f"""
User context:
- Daily calorie goal: {goals.get('dailyCalories', 'not set')} kcal
- Protein goal: {goals.get('proteinGrams', 'not set')} g
- Allergies/intolerances: {', '.join(allergies) if allergies else 'none'}
- Medical conditions: {', '.join(ctx.get('medicalConditions', [])) or 'none'}
"""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + context_block},
        *[{"role": m.role, "content": m.content} for m in request.history[-10:]],
        {"role": "user", "content": request.message},
    ]

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=400,
        temperature=0.7,
    )

    reply = response.choices[0].message.content
    tokens = response.usage.total_tokens

    return ChatbotResponse(reply=reply, tokens_used=tokens)


# ─── GET /health ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": yolo_model is not None,
        "model_path": MODEL_PATH,
    }


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
