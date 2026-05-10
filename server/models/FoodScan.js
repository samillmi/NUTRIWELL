const mongoose = require('mongoose');

const BoundingBoxSchema = new mongoose.Schema(
  {
    x1: Number, y1: Number,
    x2: Number, y2: Number,
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false }
);

const DetectedItemSchema = new mongoose.Schema(
  {
    label:          { type: String, required: true },   // YOLOv8 class label
    confidence:     { type: Number, required: true },
    boundingBox:    BoundingBoxSchema,
    estimatedGrams: { type: Number },                   // Portion size estimate
    nutrition: {
      calories:      { type: Number, default: 0 },
      proteinG:      { type: Number, default: 0 },
      carbohydrateG: { type: Number, default: 0 },
      fatG:          { type: Number, default: 0 },
      fiberG:        { type: Number, default: 0 },
    },
    nutritionSource: {
      type: String,
      enum: ['usda', 'nutritionix', 'openfoodfacts', 'manual', 'estimated'],
      default: 'estimated',
    },
  },
  { _id: true }
);

const FoodScanSchema = new mongoose.Schema(
  {
    patient:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Image data ─────────────────────────────────────────────────────────
    imageUrl:      { type: String, required: true },     // Cloudinary URL
    imagePublicId: { type: String },
    annotatedImageUrl: { type: String },                 // YOLO-annotated output

    // ── Detection results ──────────────────────────────────────────────────
    detectedItems: [DetectedItemSchema],

    // ── Aggregated totals ──────────────────────────────────────────────────
    totalNutrition: {
      calories:      { type: Number, default: 0 },
      proteinG:      { type: Number, default: 0 },
      carbohydrateG: { type: Number, default: 0 },
      fatG:          { type: Number, default: 0 },
      fiberG:        { type: Number, default: 0 },
    },

    // ── Processing metadata ────────────────────────────────────────────────
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'unknown'],
      default: 'unknown',
    },
    loggedAt:          { type: Date, default: Date.now },
    processingStatus:  { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    processingError:   { type: String },
    processingTimeMs:  { type: Number },
    modelVersion:      { type: String, default: 'yolov8n' },

    // ── User correction ────────────────────────────────────────────────────
    isManuallyEdited:  { type: Boolean, default: false },
    userNotes:         { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
  }
);

FoodScanSchema.index({ patient: 1, loggedAt: -1 });
FoodScanSchema.index({ processingStatus: 1 });

module.exports = mongoose.model('FoodScan', FoodScanSchema);
