const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  soil: { type: String, required: true },
  rainfall: { type: String, required: true },
  temperature: { type: String, required: true },
  suitability: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Poor'], default: 'Good' },
  description: { type: String, default: 'A versatile crop suitable for various conditions' },
  growingSeason: { type: String, default: 'Seasonal' },
  waterRequirements: { type: String, default: 'Moderate' },
  soilPreference: { type: String },
  estimatedYield: { type: String, default: 'N/A' }
}, { timestamps: true });

// Add indexes for better query performance
cropSchema.index({ soil: 1 });
cropSchema.index({ rainfall: 1 });
cropSchema.index({ temperature: 1 });

module.exports = mongoose.model("Crop", cropSchema);