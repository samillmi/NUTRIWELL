const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true,
      min: 0 
    },
    currency: { 
      type: String, 
      default: 'usd' 
    },
    type: {
      type: String,
      enum: ['plan_purchase', 'consultation_booking', 'subscription'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed'
    },
    // References to what was bought
    dietPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DietPlan'
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    consultationDate: {
      type: Date
    },
    stripePaymentId: { 
      type: String 
    },
    description: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ user: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
