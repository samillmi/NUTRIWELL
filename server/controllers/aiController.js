/**
 * aiController.js
 *
 * Handles:
 *   POST /api/ai/scan         — Food image → YOLOv8 → nutrition breakdown
 *   POST /api/ai/chatbot      — Conversational dietary assistant
 *   GET  /api/ai/scan/history — Patient's past food scans
 *   GET  /api/ai/scan/:id     — Single scan detail
 */

const cloudinary    = require('../config/cloudinary');
const FoodScan      = require('../models/FoodScan');
const User          = require('../models/User');
const aiService     = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// ─── Helper: upload buffer to Cloudinary ────────────────────────────────────

const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'dietary-platform/food-scans', ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// ─── POST /api/ai/scan ───────────────────────────────────────────────────────

/**
 * Flow:
 * 1. Validate uploaded file exists (Multer already ran)
 * 2. Upload original image to Cloudinary
 * 3. Create a FoodScan doc in "processing" state
 * 4. Call Python AI microservice with the image buffer
 * 5. Upload annotated/annotated result image to Cloudinary
 * 6. Persist detection results & nutrition totals
 * 7. Respond with full scan result
 */
exports.scanFoodImage = async (req, res) => {
  const startTime = Date.now();

  // 1. File validation
  if (!req.file) {
    return sendError(res, 400, 'No image file uploaded. Use field name "image".');
  }

  const { buffer, originalname, mimetype } = req.file;
  const mealType = req.body.mealType || 'unknown';

  // 2. Upload original to Cloudinary
  let originalUpload;
  try {
    originalUpload = await uploadToCloudinary(buffer, {
      resource_type: 'image',
      public_id:     `original_${Date.now()}`,
    });
  } catch (uploadErr) {
    console.error('[AI Scan] Cloudinary upload failed:', uploadErr);
    return sendError(res, 500, 'Failed to upload image. Please try again.');
  }

  // 3. Create pending FoodScan record
  const scan = await FoodScan.create({
    patient:          req.user._id,
    imageUrl:         originalUpload.secure_url,
    imagePublicId:    originalUpload.public_id,
    mealType,
    processingStatus: 'processing',
  });

  // 4. Call Python AI microservice
  let aiResult;
  try {
    aiResult = await aiService.scanFoodImage(buffer, originalname, mimetype);
  } catch (aiErr) {
    console.error('[AI Scan] AI service error:', aiErr.message);
    await FoodScan.findByIdAndUpdate(scan._id, {
      processingStatus: 'failed',
      processingError:  aiErr.message,
    });
    return sendError(res, 502, 'AI food detection service is unavailable. Please try again later.');
  }

  // 5. Upload annotated image returned by Python service (base64 → buffer)
  let annotatedUrl = null;
  if (aiResult.annotated_image_base64) {
    try {
      const b64Data = aiResult.annotated_image_base64.replace(/^data:image\/\w+;base64,/, '');
      const annotatedBuffer = Buffer.from(b64Data, 'base64');
      const annotatedUpload = await uploadToCloudinary(annotatedBuffer, {
        public_id: `annotated_${scan._id}`,
      });
      annotatedUrl = annotatedUpload.secure_url;
    } catch (e) {
      console.warn('[AI Scan] Annotated image upload failed (non-fatal):', e.message);
    }
  }

  // 6. Map AI response → Mongoose sub-document shape
  const detectedItems = (aiResult.detections || []).map((d) => ({
    label:          d.label,
    confidence:     d.confidence,
    boundingBox:    d.bounding_box
      ? { x1: d.bounding_box.x1, y1: d.bounding_box.y1, x2: d.bounding_box.x2, y2: d.bounding_box.y2, confidence: d.confidence }
      : undefined,
    estimatedGrams: d.estimated_grams,
    nutrition: {
      calories:      d.nutrition?.calories      ?? 0,
      proteinG:      d.nutrition?.protein_g     ?? 0,
      carbohydrateG: d.nutrition?.carbohydrate_g ?? 0,
      fatG:          d.nutrition?.fat_g          ?? 0,
      fiberG:        d.nutrition?.fiber_g        ?? 0,
    },
    nutritionSource: d.nutrition_source || 'estimated',
  }));

  const totals = aiResult.totals || {};
  const totalNutrition = {
    calories:      totals.calories       ?? 0,
    proteinG:      totals.protein_g      ?? 0,
    carbohydrateG: totals.carbohydrate_g ?? 0,
    fatG:          totals.fat_g          ?? 0,
    fiberG:        totals.fiber_g        ?? 0,
  };

  const processingTimeMs = Date.now() - startTime;

  // 7. Persist full results
  const updatedScan = await FoodScan.findByIdAndUpdate(
    scan._id,
    {
      annotatedImageUrl: annotatedUrl,
      detectedItems,
      totalNutrition,
      processingStatus:  'completed',
      processingTimeMs,
      modelVersion:      aiResult.model_version || 'yolov8n',
    },
    { new: true }
  ).populate('patient', 'firstName lastName');

  return sendSuccess(res, 201, 'Food scan completed successfully.', { scan: updatedScan });
};

// ─── POST /api/ai/chatbot ────────────────────────────────────────────────────

exports.getChatbotResponse = async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || message.trim().length === 0) {
    return sendError(res, 400, 'Message is required.');
  }
  if (message.length > 2000) {
    return sendError(res, 400, 'Message is too long. Max 2000 characters.');
  }

  // Build context from patient's profile for personalized advice
  const user = await User.findById(req.user._id).lean();
  const userContext = {
    dietaryGoals:     user.dietaryGoals || {},
    allergies:        user.allergies    || [],
    medicalConditions:user.medicalConditions || [],
    currentMetrics:   user.currentMetrics || {},
  };

  let botResponse;
  try {
    botResponse = await aiService.getDietaryChatbotResponse(message, history, userContext);
  } catch (err) {
    console.error('[Chatbot] AI service error:', err.message);
    return sendError(res, 502, 'Chatbot service is temporarily unavailable.');
  }

  return sendSuccess(res, 200, 'Chatbot response generated.', {
    reply:  botResponse.reply,
    tokens: botResponse.tokens_used,
  });
};

// ─── GET /api/ai/scan/history ────────────────────────────────────────────────

exports.getScanHistory = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit || '10', 10));
  const skip  = (page - 1) * limit;

  const filter = { patient: req.user._id, processingStatus: 'completed' };

  // Optional date range filter
  if (req.query.from || req.query.to) {
    filter.loggedAt = {};
    if (req.query.from) filter.loggedAt.$gte = new Date(req.query.from);
    if (req.query.to)   filter.loggedAt.$lte = new Date(req.query.to);
  }

  const [scans, total] = await Promise.all([
    FoodScan.find(filter)
      .sort({ loggedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('imageUrl annotatedImageUrl totalNutrition detectedItems mealType loggedAt processingTimeMs'),
    FoodScan.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, 'Scan history retrieved.', {
    scans,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// ─── GET /api/ai/scan/:id ─────────────────────────────────────────────────────

exports.getScanById = async (req, res) => {
  const scan = await FoodScan.findOne({
    _id:     req.params.id,
    patient: req.user._id,           // patients can only view their own scans
  });

  if (!scan) {
    return sendError(res, 404, 'Food scan not found.');
  }

  return sendSuccess(res, 200, 'Scan retrieved.', { scan });
};
