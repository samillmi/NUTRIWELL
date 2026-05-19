const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  consultations: { type: Number, required: true },
  features: [{ type: String }],
  gradient: { type: String },
  popular: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Plan', PlanSchema);
