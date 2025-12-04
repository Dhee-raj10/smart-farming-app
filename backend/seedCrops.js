// Run this script to populate your database with sample crop data
// Usage: node seedCrops.js

require("dotenv").config();
const mongoose = require("mongoose");
const Crop = require("./models/Crop");

const sampleCrops = [
  {
    name: "Rice",
    soil: "Clay",
    rainfall: "High",
    temperature: "Warm",
    suitability: "Excellent",
    description: "Rice is a staple crop that thrives in waterlogged conditions and warm climates.",
    growingSeason: "Monsoon (June-October)",
    waterRequirements: "High - requires flooding",
    soilPreference: "Clay or clay loam",
    estimatedYield: "4-6 tons/hectare"
  },
  {
    name: "Wheat",
    soil: "Loamy",
    rainfall: "Medium",
    temperature: "Cool",
    suitability: "Excellent",
    description: "Wheat is a versatile cereal crop ideal for cool season cultivation.",
    growingSeason: "Winter (November-March)",
    waterRequirements: "Moderate",
    soilPreference: "Well-drained loamy soil",
    estimatedYield: "3-5 tons/hectare"
  },
  {
    name: "Maize (Corn)",
    soil: "Loamy",
    rainfall: "Medium",
    temperature: "Warm",
    suitability: "Good",
    description: "Maize is a high-yielding crop suitable for various soil types.",
    growingSeason: "Summer (March-July)",
    waterRequirements: "Moderate to High",
    soilPreference: "Deep, well-drained fertile soil",
    estimatedYield: "5-8 tons/hectare"
  },
  {
    name: "Cotton",
    soil: "Black",
    rainfall: "Medium",
    temperature: "Warm",
    suitability: "Excellent",
    description: "Cotton is a cash crop that requires warm weather and moderate rainfall.",
    growingSeason: "Kharif (June-November)",
    waterRequirements: "Moderate",
    soilPreference: "Black cotton soil (Vertisols)",
    estimatedYield: "2-3 tons/hectare"
  },
  {
    name: "Sugarcane",
    soil: "Loamy",
    rainfall: "High",
    temperature: "Warm",
    suitability: "Good",
    description: "Sugarcane is a tropical crop requiring abundant water and sunshine.",
    growingSeason: "Year-round (12-18 months)",
    waterRequirements: "Very High",
    soilPreference: "Deep, well-drained loamy soil",
    estimatedYield: "70-100 tons/hectare"
  },
  {
    name: "Groundnut (Peanut)",
    soil: "Sandy",
    rainfall: "Medium",
    temperature: "Warm",
    suitability: "Good",
    description: "Groundnut is a legume crop that improves soil fertility.",
    growingSeason: "Kharif/Rabi (varies by region)",
    waterRequirements: "Low to Moderate",
    soilPreference: "Well-drained sandy loam",
    estimatedYield: "1-2 tons/hectare"
  },
  {
    name: "Soybean",
    soil: "Loamy",
    rainfall: "Medium",
    temperature: "Warm",
    suitability: "Good",
    description: "Soybean is a protein-rich legume crop with multiple uses.",
    growingSeason: "Kharif (June-October)",
    waterRequirements: "Moderate",
    soilPreference: "Well-drained loamy soil",
    estimatedYield: "1.5-2.5 tons/hectare"
  },
  {
    name: "Tomato",
    soil: "Loamy",
    rainfall: "Low",
    temperature: "Moderate",
    suitability: "Good",
    description: "Tomato is a popular vegetable crop with high market demand.",
    growingSeason: "Year-round (with irrigation)",
    waterRequirements: "Moderate with drip irrigation",
    soilPreference: "Well-drained loamy soil with organic matter",
    estimatedYield: "20-40 tons/hectare"
  },
  {
    name: "Potato",
    soil: "Sandy",
    rainfall: "Medium",
    temperature: "Cool",
    suitability: "Good",
    description: "Potato is a tuberous crop ideal for cool climates.",
    growingSeason: "Winter (October-February)",
    waterRequirements: "Moderate",
    soilPreference: "Loose, well-drained sandy loam",
    estimatedYield: "20-35 tons/hectare"
  },
  {
    name: "Onion",
    soil: "Loamy",
    rainfall: "Low",
    temperature: "Moderate",
    suitability: "Good",
    description: "Onion is a bulb vegetable with excellent storage properties.",
    growingSeason: "Rabi (October-March)",
    waterRequirements: "Low to Moderate",
    soilPreference: "Well-drained loamy soil",
    estimatedYield: "15-25 tons/hectare"
  },
  {
    name: "Chickpea",
    soil: "Loamy",
    rainfall: "Low",
    temperature: "Cool",
    suitability: "Good",
    description: "Chickpea is a drought-tolerant legume crop.",
    growingSeason: "Rabi (October-March)",
    waterRequirements: "Low",
    soilPreference: "Well-drained loamy to clay loam",
    estimatedYield: "1-1.5 tons/hectare"
  },
  {
    name: "Banana",
    soil: "Loamy",
    rainfall: "High",
    temperature: "Warm",
    suitability: "Excellent",
    description: "Banana is a tropical fruit crop requiring consistent moisture.",
    growingSeason: "Year-round",
    waterRequirements: "Very High",
    soilPreference: "Deep, well-drained loamy soil",
    estimatedYield: "30-50 tons/hectare"
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing crops
    await Crop.deleteMany({});
    console.log("🗑️  Cleared existing crop data");

    // Insert sample crops
    await Crop.insertMany(sampleCrops);
    console.log(`✅ Successfully seeded ${sampleCrops.length} crops`);

    // Display seeded crops
    const crops = await Crop.find();
    console.log("\n📊 Seeded Crops:");
    crops.forEach(crop => {
      console.log(`   - ${crop.name} (${crop.soil} soil, ${crop.rainfall} rainfall, ${crop.temperature} temp)`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();