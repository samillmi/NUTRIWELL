"""
Python FastAPI Microservice — Custom YOLOv8 Food Detection + Local Nutrition

Endpoints:
  POST /scan     — 100% Local Object Detection (Custom Model) + Local Nutrition
  POST /chatbot  — LLM-based dietary chatbot (Gemini/OpenAI)
  GET  /health   — Liveness check
"""

import io
import os
import time
import base64
import logging
import json
import re
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
import google.generativeai as genai

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

# ─── Config ──────────────────────────────────────────────────────────────────

MODEL_PATH        = r"C:\Users\one\Desktop\ff\ai-service\best.pt"
CONFIDENCE_THRESH = float(os.getenv("YOLO_CONFIDENCE", "0.40"))
API_KEY           = os.getenv("AI_SERVICE_API_KEY", "")
NUTRITIONIX_APP_ID  = os.getenv("NUTRITIONIX_APP_ID", "")
NUTRITIONIX_APP_KEY = os.getenv("NUTRITIONIX_APP_KEY", "")
OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "")

# ─── Global model handle ──────────────────────────────────────────────────────

yolo_model: Optional[YOLO] = None
openai_client: Optional[OpenAI] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global yolo_model
    logger.info("Loading Custom YOLOv8 model from: %s", MODEL_PATH)
    yolo_model = YOLO(MODEL_PATH)
    logger.info("Custom YOLOv8 model loaded. Classes: %d", len(yolo_model.names))
    
    logger.info("-----------------------------------------")
    logger.info("AI Service started in 100% LOCAL MODE")
    logger.info("Food Scanner is now independent of Gemini")
    logger.info("-----------------------------------------")

    yield

    logger.info("Shutting down AI service.")


# ─── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Dietary Platform AI Service",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


# ─── Nutrition lookup via API Ninjas ─────────────────────────────────────────

NUTRITION_CACHE: dict[str, NutritionInfo] = {}
NINJAS_API_KEY = "eBMYCmjGPLLflVJkklpFnoncvm5DHLIztOybYyMt"

async def fetch_nutrition(food_label: str, grams: float = 100.0) -> tuple[NutritionInfo, str]:
    """Live Nutritional Lookup via API Ninjas."""
    food_key = food_label.lower()
    cache_key = f"{food_key}_{int(grams)}"
    if cache_key in NUTRITION_CACHE:
        return NUTRITION_CACHE[cache_key], "cache"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"https://api.api-ninjas.com/v1/nutrition?query={food_label}",
                headers={"X-Api-Key": NINJAS_API_KEY}
            )
            resp.raise_for_status()
            data = resp.json()
            
            if data and len(data) > 0:
                food = data[0]
                # API Ninjas returns values per 100g (usually) or per serving
                # We normalize to the estimated grams
                base_calories = food.get("calories", 0)
                # Note: API Ninjas 'serving_size_g' is often 100g
                serving_g = food.get("serving_size_g", 100)
                factor = grams / serving_g

                info = NutritionInfo(
                    calories      = round(base_calories * factor, 1),
                    protein_g     = round(food.get("protein_g", 0) * factor, 1),
                    carbohydrate_g= round(food.get("carbohydrates_total_g", 0) * factor, 1),
                    fat_g         = round(food.get("fat_total_g", 0) * factor, 1),
                    fiber_g       = round(food.get("fiber_g", 0) * factor, 1),
                )
                NUTRITION_CACHE[cache_key] = info
                return info, "api_ninjas"
    except Exception as e:
        logger.warning("API Ninjas lookup failed for '%s': %s", food_label, e)

    # Final fallback to a generic estimate
    factor = grams / 100.0
    info = NutritionInfo(
        calories=round(150 * factor, 1),
        protein_g=round(5 * factor, 1),
        carbohydrate_g=round(20 * factor, 1),
        fat_g=round(5 * factor, 1),
        fiber_g=round(1 * factor, 1),
    )
    return info, "local_estimate"


# ─── POST /scan ───────────────────────────────────────────────────────────────

@app.post("/scan", response_model=ScanResponse, dependencies=[Depends(verify_api_key)])
async def scan_food(file: UploadFile = File(...)):
    """100% Local Custom YOLO Scanner."""
    start_ms = int(time.time() * 1000)

    contents = await file.read()
    try:
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

    results = yolo_model.predict(source=pil_image, conf=CONFIDENCE_THRESH, verbose=False)
    result = results[0]
    
    annotated_array = result.plot()
    annotated_pil   = Image.fromarray(annotated_array[..., ::-1])
    buf = io.BytesIO()
    annotated_pil.save(buf, format="JPEG", quality=85)
    annotated_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    detections: list[DetectedItem] = []
    for box in result.boxes:
        cls_idx     = int(box.cls[0])
        label       = yolo_model.names[cls_idx]
        confidence  = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()

        box_area     = (x2 - x1) * (y2 - y1)
        image_area   = pil_image.width * pil_image.height
        area_ratio   = box_area / image_area
        est_grams    = max(50.0, round(area_ratio * 800, 1))

        nutrition, source = await fetch_nutrition(label, est_grams)
        detections.append(
            DetectedItem(
                label=label,
                confidence=round(confidence, 4),
                bounding_box=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                estimated_grams=est_grams,
                nutrition=nutrition,
                nutrition_source=source,
            )
        )

    total_nutrition = NutritionInfo(
        calories      = sum(d.nutrition.calories       for d in detections),
        protein_g     = sum(d.nutrition.protein_g      for d in detections),
        carbohydrate_g= sum(d.nutrition.carbohydrate_g for d in detections),
        fat_g         = sum(d.nutrition.fat_g          for d in detections),
        fiber_g       = sum(d.nutrition.fiber_g        for d in detections),
    )

    return ScanResponse(
        success                = True,
        model_version          = "custom-yolo-v8-local",
        processing_time_ms     = int(time.time() * 1000) - start_ms,
        annotated_image_base64 = annotated_b64,
        detections             = detections,
        totals                 = total_nutrition,
    )


# ─── POST /chatbot ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are NutriBot, an expert AI dietary assistant integrated into a 
medical nutrition platform. You provide evidence-based dietary advice, meal suggestions, 
and answer questions about food and nutrition. Always be supportive, empathetic, and 
safety-conscious. Keep responses concise (under 200 words)."""


@app.post("/chatbot", response_model=ChatbotResponse, dependencies=[Depends(verify_api_key)])
async def chatbot(request: ChatbotRequest):
    global openai_client
    
    # Build context
    ctx = request.context
    context_block = ""
    if ctx:
        goals = ctx.get("dietaryGoals", {}) or {}
        metrics = ctx.get("currentMetrics", {}) or {}
        allergies = ctx.get("allergies", []) or []
        conditions = ctx.get("medicalConditions", []) or []
        focus = ctx.get("focusAreas", []) or []
        gender = ctx.get("gender")

        context_lines = [
            "\nUser Context:",
            f"- Name: {ctx.get('firstName', '')} {ctx.get('lastName', '')}".strip()
        ]
        if gender:
            context_lines.append(f"- Gender: {gender}")

        # Dietary Goals
        goal_parts = []
        if goals.get('dailyCalories'):
            goal_parts.append(f"Calories: {goals.get('dailyCalories')} kcal")
        if goals.get('proteinGrams'):
            goal_parts.append(f"Protein: {goals.get('proteinGrams')}g")
        if goals.get('carbohydrateGrams'):
            goal_parts.append(f"Carbs: {goals.get('carbohydrateGrams')}g")
        if goals.get('fatGrams'):
            goal_parts.append(f"Fat: {goals.get('fatGrams')}g")
        if goal_parts:
            context_lines.append(f"- Dietary Goals: {', '.join(goal_parts)}")

        # Health Metrics
        metric_parts = []
        if metrics.get('weight'):
            metric_parts.append(f"Weight: {metrics.get('weight')} kg")
        if metrics.get('height'):
            metric_parts.append(f"Height: {metrics.get('height')} cm")
        if metrics.get('bmi'):
            metric_parts.append(f"BMI: {metrics.get('bmi')}")
        if metrics.get('targetWeight'):
            metric_parts.append(f"Target Weight: {metrics.get('targetWeight')} kg")
        if metrics.get('activityLevel'):
            metric_parts.append(f"Activity Level: {str(metrics.get('activityLevel')).replace('_', ' ')}")
        if metric_parts:
            context_lines.append(f"- Health Metrics: {', '.join(metric_parts)}")

        # Allergies & Conditions
        if allergies:
            context_lines.append(f"- Allergies: {', '.join(allergies)}")
        if conditions:
            context_lines.append(f"- Medical Conditions: {', '.join(conditions)}")
        if focus:
            context_lines.append(f"- Focus Areas: {', '.join(focus)}")

        context_block = "\n".join(context_lines) + "\n"

    # Lazy AI init
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
    if OPENAI_API_KEY and not openai_client:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)

    # 1. Try Gemini
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=SYSTEM_PROMPT + context_block)
            chat = model.start_chat(history=[{"role": "user" if m.role == "user" else "model", "parts": [m.content]} for m in request.history[-10:]])
            response = chat.send_message(request.message)
            return ChatbotResponse(reply=response.text, tokens_used=0)
        except Exception as e:
            logger.error("Gemini failed: %s", e)

    # 2. Fallback OpenAI
    if openai_client:
        try:
            messages = [{"role": "system", "content": SYSTEM_PROMPT + context_block}]
            messages.extend([{"role": m.role, "content": m.content} for m in request.history[-10:]])
            messages.append({"role": "user", "content": request.message})
            response = openai_client.chat.completions.create(model="gpt-4o-mini", messages=messages)
            return ChatbotResponse(reply=response.choices[0].message.content, tokens_used=response.usage.total_tokens)
        except Exception as e:
            logger.error("OpenAI failed: %s", e)

    return ChatbotResponse(reply="AI is currently unavailable. Using demo response.", tokens_used=0)


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
