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
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(null, true);
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
//              🔥 KEEP FLASK API WARM (Render Free Tier Fix)
// ====================================================================
// Ping Flask every 5 minutes to prevent spin-down
setInterval(async () => {
  try {
    await axios.get(`${FLASK_API_URL}/health`, { timeout: 10000 });
    console.log('✅ Flask keep-alive ping successful');
  } catch (err) {
    console.log('⚠️  Flask keep-alive ping failed:', err.message);
  }
}, 5 * 60 * 1000); // 5 minutes

// Initial ping on startup
setTimeout(async () => {
  try {
    console.log('🔄 Initial Flask health check...');
    const response = await axios.get(`${FLASK_API_URL}/health`, { timeout: 30000 });
    console.log('✅ Flask is ready:', response.data);
  } catch (err) {
    console.log('⚠️  Flask not ready yet:', err.message);
  }
}, 5000);

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
        timeout: 120000, // 2 minutes (Render can be slow)
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('✅ Flask response received:', response.status);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Fertility API error:", error.message);
    console.error("❌ Error details:", error.response?.data || error.code);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: "Flask API is taking too long to respond. It may be starting up. Please try again in 30 seconds.",
        details: "Timeout waiting for ML service"
      });
    }
    
    res.status(500).json({ 
      error: "Failed to get fertility prediction",
      details: error.response?.data || error.message,
      flaskUrl: FLASK_API_URL
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
        timeout: 120000 // 2 minutes
      }
    );
    console.log('✅ Flask irrigation response received');
    res.json(response.data);
  } catch (error) {
    console.error("❌ Irrigation API error:", error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: "Flask API is taking too long. Please try again in 30 seconds.",
        details: "Timeout waiting for ML service"
      });
    }

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
    console.log(`   File: ${req.file.originalname} (${req.file.size} bytes)`);

    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // 🔥 INCREASED TIMEOUT FOR IMAGE PROCESSING
    const response = await axios.post(
      `${FLASK_API_URL}/predict/soil-image`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 180000, // 3 MINUTES for image processing + cold start
        maxContentLength: Infinity,
        maxBodyLength: Infinity
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
    console.error("❌ Error code:", error.code);

    // Clean up uploaded file on error
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: "Image analysis is taking too long. The Flask API may be starting up (this can take 30-60 seconds on Render's free tier). Please try again.",
        suggestion: "Wait 30 seconds and try uploading again"
      });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Cannot connect to ML service. It may be starting up.",
        suggestion: "Wait 30 seconds and try again"
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
      timeout: 10000,
    });

    res.json({
      backend: "healthy",
      flask: flaskResponse.data,
      flaskUrl: FLASK_API_URL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.json({
      backend: "healthy",
      flask: "unavailable",
      flaskUrl: FLASK_API_URL,
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
    flaskUrl: FLASK_API_URL,
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