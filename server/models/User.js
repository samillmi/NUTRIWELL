const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ─── Embedded sub-schemas ───────────────────────────────────────────────────

const HealthMetricsSchema = new mongoose.Schema(
  {
    weight:       { type: Number },          // kg
    height:       { type: Number },          // cm
    bmi:          { type: Number },
    targetWeight: { type: Number },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
      default: 'sedentary',
    },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const DoctorProfileSchema = new mongoose.Schema(
  {
    licenseNumber:  { type: String },
    specialization: { type: String, default: 'Dietitian' },
    yearsOfExperience: { type: Number, default: 0 },
    bio:            { type: String, maxlength: 1000 },
    availableSlots: [{ day: String, from: String, to: String }],
    isVerified:     { type: Boolean, default: false },
    verifiedAt:     { type: Date },
    verifiedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating:         { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:   { type: Number, default: 0 },
    consultationFee: { type: Number, default: 29 },
  },
  { _id: false }
);

const SubscriptionSchema = new mongoose.Schema(
  {
    plan:      { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    status:    { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
    startDate: { type: Date },
    endDate:   { type: Date },
    stripeCustomerId:     { type: String },
    stripeSubscriptionId: { type: String },
  },
  { _id: false }
);

// ─── Main User Schema ───────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────
    firstName:  { type: String, required: true, trim: true, maxlength: 50 },
    lastName:   { type: String, required: true, trim: true, maxlength: 50 },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true, minlength: 8, select: false },
    avatar:     { type: String, default: '' },          // Cloudinary URL
    phone:      { type: String, default: '' },
    dateOfBirth:{ type: Date },
    gender:     { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },

    // ── RBAC ──────────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ['admin', 'doctor', 'patient'],
      required: true,
      default: 'patient',
    },

    // ── Account state ─────────────────────────────────────────────────────
    isActive:         { type: Boolean, default: true },
    isEmailVerified:  { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
    lastLogin:        { type: Date },

    // ── Role-specific sub-documents ───────────────────────────────────────
    doctorProfile: DoctorProfileSchema,

    // Patient-only fields
    assignedDoctor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    consultationDate:{ type: Date },
    healthMetrics:   [HealthMetricsSchema],              // Historical snapshots
    currentMetrics:  HealthMetricsSchema,               // Latest snapshot
    dietaryGoals: {
      dailyCalories:     { type: Number, default: 2000 },
      proteinGrams:      { type: Number, default: 50 },
      carbohydrateGrams: { type: Number, default: 250 },
      fatGrams:          { type: Number, default: 65 },
      waterMl:           { type: Number, default: 2000 },
    },
    allergies: [{ type: String }],
    medicalConditions: [{ type: String }],

    // ── Subscription (patients & doctors) ────────────────────────────────
    subscription: SubscriptionSchema,

    // ── Notifications preferences ─────────────────────────────────────────
    notifications: {
      email:       { type: Boolean, default: true },
      push:        { type: Boolean, default: true },
      sms:         { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,        // createdAt, updatedAt
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ─── Virtuals ───────────────────────────────────────────────────────────────

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Hooks ──────────────────────────────────────────────────────────────────

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance methods ────────────────────────────────────────────────────────

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerifyToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

// ─── Static helpers ──────────────────────────────────────────────────────────

UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// ─── Indexes ─────────────────────────────────────────────────────────────────

UserSchema.index({ role: 1 });
UserSchema.index({ assignedDoctor: 1 });
UserSchema.index({ 'doctorProfile.isVerified': 1 });
UserSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', UserSchema);
