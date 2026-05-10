const mongoose = require('mongoose');

// ─── Nested schemas ──────────────────────────────────────────────────────────

const NutritionSchema = new mongoose.Schema(
  {
    calories:      { type: Number, default: 0 },
    proteinG:      { type: Number, default: 0 },
    carbohydrateG: { type: Number, default: 0 },
    fatG:          { type: Number, default: 0 },
    fiberG:        { type: Number, default: 0 },
    sugarG:        { type: Number, default: 0 },
    sodiumMg:      { type: Number, default: 0 },
  },
  { _id: false }
);

const FoodItemSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    quantity:  { type: Number, required: true },           // grams or ml
    unit:      { type: String, default: 'g' },
    nutrition: NutritionSchema,
    imageUrl:  { type: String, default: '' },
    notes:     { type: String, maxlength: 500 },
  },
  { _id: true }
);

const MealSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['breakfast', 'mid_morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'],
      required: true,
    },
    time:      { type: String },                           // e.g. "08:00"
    foods:     [FoodItemSchema],
    totalNutrition: NutritionSchema,
    instructions: { type: String, maxlength: 2000 },
  },
  { _id: true }
);

const DayPlanSchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true, min: 1 },   // 1 = Monday, 7 = Sunday
    dayName:   { type: String },                            // e.g. "Monday"
    meals:     [MealSchema],
    dailyTarget: NutritionSchema,
    notes:     { type: String, maxlength: 1000 },
    waterTargetMl: { type: Number, default: 2000 },
  },
  { _id: true }
);

// ─── Main DietPlan Schema ────────────────────────────────────────────────────

const DietPlanSchema = new mongoose.Schema(
  {
    // ── Relationships ─────────────────────────────────────────────────────
    doctor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: function() { return !this.isPublic; }
    },

    // ── Identity ──────────────────────────────────────────────────────────
    title:       { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 2000 },
    category: {
      type: String,
      enum: ['weight_loss', 'weight_gain', 'maintenance', 'diabetic', 'cardiac', 'renal', 'sports', 'other'],
      default: 'other',
    },
    tags: [{ type: String }],
    price: { type: Number, default: 0 }, // For public templates

    // ── Duration ──────────────────────────────────────────────────────────
    durationWeeks: { type: Number, required: true, min: 1, max: 52 },
    startDate:     { type: Date, required: true },
    endDate:       { type: Date },

    // ── Weekly schedule (7 day plans) ─────────────────────────────────────
    weeklyPlan: [DayPlanSchema],

    // ── Overall targets ───────────────────────────────────────────────────
    weeklyCalorieTarget: { type: Number },
    restrictions: [{ type: String }],              // e.g. ['gluten-free', 'vegan']

    // ── Status workflow ───────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'cancelled', 'on_hold'],
      default: 'draft',
    },
    isPublic: { type: Boolean, default: false },   // template sharing

    // ── Patient feedback ──────────────────────────────────────────────────
    patientRating:  { type: Number, min: 1, max: 5 },
    patientFeedback:{ type: String, maxlength: 1000 },
    patientAcknowledgedAt: { type: Date },

    // ── Doctor notes ──────────────────────────────────────────────────────
    doctorNotes: { type: String, maxlength: 2000 },
    followUpDate: { type: Date },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ────────────────────────────────────────────────────────────────

DietPlanSchema.virtual('isExpired').get(function () {
  return this.endDate && new Date() > this.endDate;
});

// ─── Pre-save hook — auto compute endDate & day names ────────────────────────

DietPlanSchema.pre('save', function (next) {
  if (this.startDate && this.durationWeeks && !this.endDate) {
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + this.durationWeeks * 7);
    this.endDate = end;
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  if (this.weeklyPlan) {
    this.weeklyPlan.forEach((day) => {
      if (!day.dayName && day.dayNumber) {
        day.dayName = days[day.dayNumber - 1];
      }
    });
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

DietPlanSchema.index({ doctor: 1, patient: 1 });
DietPlanSchema.index({ patient: 1, status: 1 });
DietPlanSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('DietPlan', DietPlanSchema);
