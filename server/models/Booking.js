const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.type === 'consultation'; }
  },
  type: {
    type: String,
    enum: ['consultation', 'scanner', 'chatbot', 'plan_purchase'],
    default: 'consultation'
  },
  date: {
    type: Date,
    required: function() { return this.type === 'consultation'; }
  },
  time: {
    type: String,
    required: function() { return this.type === 'consultation'; }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'confirmed'
  },
  reason: {
    type: String,
    required: function() { return this.type === 'consultation'; }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
