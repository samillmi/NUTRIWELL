/**
 * aiService.js
 *
 * HTTP bridge from the Node/Express backend to the Python FastAPI
 * YOLOv8 microservice.  Keeps the Node process stateless — no Python
 * child-processes here.
 */

const axios    = require('axios');
const FormData = require('form-data');

const AI_SERVICE_URL     = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '30000', 10);

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: AI_SERVICE_TIMEOUT,
  headers: { 'X-Api-Key': process.env.AI_SERVICE_API_KEY },
});

/**
 * Sends an image buffer to the Python /scan endpoint and returns
 * structured detection + nutrition results.
 *
 * @param {Buffer} imageBuffer     - Raw image bytes (from Multer memory storage)
 * @param {string} originalname    - Original filename for MIME inference
 * @param {string} mimetype        - e.g. 'image/jpeg'
 * @returns {Promise<ScanResult>}
 */
const scanFoodImage = async (imageBuffer, originalname, mimetype) => {
  const form = new FormData();
  form.append('file', imageBuffer, {
    filename:    originalname,
    contentType: mimetype,
  });

  const response = await aiClient.post('/scan', form, {
    headers: form.getHeaders(),
  });

  return response.data;  // See Python /scan response shape below
};

/**
 * Sends a chat message to the LLM chatbot endpoint.
 *
 * @param {string} message           - User's question
 * @param {Array}  conversationHistory - Array of { role, content } objects
 * @param {Object} userContext       - { dietaryGoals, allergies, currentMetrics }
 * @returns {Promise<ChatbotResponse>}
 */
const getDietaryChatbotResponse = async (message, conversationHistory = [], userContext = {}) => {
  const response = await aiClient.post('/chatbot', {
    message,
    history: conversationHistory,
    context: userContext,
  });

  return response.data;
};

module.exports = { scanFoodImage, getDietaryChatbotResponse };

/*
────────────────────────────────────────────────────────────────────────────────
Expected Python /scan response shape (matches DetectedItemSchema):
{
  "success": true,
  "model_version": "yolov8n",
  "processing_time_ms": 412,
  "annotated_image_base64": "data:image/jpeg;base64,...",
  "detections": [
    {
      "label": "pizza",
      "confidence": 0.91,
      "bounding_box": { "x1": 50, "y1": 30, "x2": 320, "y2": 280 },
      "estimated_grams": 200,
      "nutrition": {
        "calories": 536,
        "protein_g": 22,
        "carbohydrate_g": 59,
        "fat_g": 23,
        "fiber_g": 3
      },
      "nutrition_source": "usda"
    }
  ],
  "totals": {
    "calories": 536,
    "protein_g": 22,
    "carbohydrate_g": 59,
    "fat_g": 23,
    "fiber_g": 3
  }
}
────────────────────────────────────────────────────────────────────────────────
*/
