const mongoose = require('mongoose');
const Plan = require('./models/Plan');
require('dotenv').config();

const plans = [
  { 
    name: 'Basic Care', 
    consultations: 1, 
    features: ['1 Consultation', 'Direct Chat with Doctor'], 
    price: 29,
    gradient: 'from-blue-500 to-indigo-600'
  },
  { 
    name: 'Standard Care', 
    consultations: 2, 
    features: ['2 Consultations', 'Direct Chat with Doctor', 'Priority Support'], 
    price: 49,
    gradient: 'from-brand-500 to-emerald-600'
  },
  { 
    name: 'Premium Care', 
    consultations: 4, 
    features: ['4 Consultations', 'Direct Chat with Doctor', 'AI Chatbot Access', 'Food Scanner Access'], 
    price: 99,
    popular: true,
    gradient: 'from-purple-500 to-pink-600'
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    await Plan.deleteMany({});
    console.log('Deleted existing plans');
    
    await Plan.insertMany(plans);
    console.log('Seeded initial plans');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
