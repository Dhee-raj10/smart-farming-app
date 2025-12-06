require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cropRoutes = require("./routes/cropRoutes");

const app = express();
connectDB();

// ====================================================================
//                    🔧 FIXED CORS CONFIGURATION
// ====================================================================
const allowedOrigins = [
  "https://smart-farming-app-2.onrender.com",  // Frontend
  "http://localhost:3000",
  "http://localhost:5173"
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(null, true); // Allow anyway for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);

// ====================================================================
//                 🌐 FLASK API CONFIGURATION
// ====================================================================
const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:8000";
console.log('🔗 Flask API URL:', FLASK_API_URL);

// ====================================================================
//                 🌱 FERTILITY PREDICTION
// ====================================================================
app.post("/api/crops/fertility", async (req, res) => {
  try {
    console.log('📤 Fertility request received');
    console.log('📊 Request body:', req.body);
    console.log('🔗 Forwarding to:', `${FLASK_API_URL}/predict/fertility`);
    
    const response = await axios.post(
      `${FLASK_API_URL}/predict/fertility`,
      req.body,
      { 
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('✅ Flask response received:', response.status);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Fertility API error:", error.message);
    console.error("❌ Error details:", error.response?.data || error);
    
    res.status(500).json({ 
      error: "Failed to get fertility prediction",
      details: error.response?.data || error.message,
      flaskUrl: FLASK_API_URL // Help debug
    });
  }
});

// ====================================================================
//          💧 IRRIGATION PREDICTION
// ====================================================================
app.post("/api/crops/moisture", async (req, res) => {
  try {
    console.log('📤 Forwarding irrigation request to Flask...');
    const response = await axios.post(
      `${FLASK_API_URL}/predict/irrigation`,
      req.body,
      { 
        headers: { "Content-Type": "application/json" },
        timeout: 30000
      }
    );
    console.log('✅ Flask irrigation response received');
    res.json(response.data);
  } catch (error) {
    console.error("❌ Irrigation API error:", error.message);
    
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Cannot connect to ML service",
        details: "Flask API is not responding"
      });
    }

    res.status(500).json({
      error: "Failed to get irrigation prediction",
      details: error.response?.data || error.message
    });
  }
});

// ====================================================================
//                 📸 SOIL IMAGE CLASSIFICATION
// ====================================================================
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

app.post("/api/crops/soil-image", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log("📤 Forwarding soil image to Flask...");

    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await axios.post(
      `${FLASK_API_URL}/predict/soil-image`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000, // 60 seconds for image processing
      }
    );

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    console.log("✅ Flask soil-image response received");
    res.json(response.data);

  } catch (error) {
    console.error("❌ Soil-image API error:", error.message);

    // Clean up uploaded file on error
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Cannot connect to ML service",
      });
    }

    res.status(500).json({
      error: "Failed to analyze soil image",
      details: error.message,
    });
  }
});

// ====================================================================
//                             ❤️ HEALTH CHECK
// ====================================================================
app.get("/api/health", async (req, res) => {
  try {
    const flaskResponse = await axios.get(`${FLASK_API_URL}/health`, {
      timeout: 5000,
    });

    res.json({
      backend: "healthy",
      flask: flaskResponse.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.json({
      backend: "healthy",
      flask: "unavailable",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ====================================================================
//                      🚀 ROOT ENDPOINT
// ====================================================================
app.get("/", (req, res) => {
  res.json({
    message: "Smart Farming Backend API",
    status: "running",
    endpoints: {
      auth: "/api/auth/*",
      crops: "/api/crops/*",
      health: "/api/health"
    }
  });
});

// ====================================================================
//                           🚀 SERVER START
// ====================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("="*50);
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🔗 Flask API: ${FLASK_API_URL}`);
  console.log(`🌐 CORS allowed origins:`, allowedOrigins);
  console.log("="*50);
});