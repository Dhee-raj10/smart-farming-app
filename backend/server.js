require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cropRoutes = require("./routes/cropRoutes");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);

// ------------------- FLASK API BASE URL -------------------
const FLASK_API_URL = process.env.FLASK_API_URL || "http://127.0.0.1:8000";


// ====================================================================
//                 🌱 FERTILITY PREDICTION (ML MODEL)
// ====================================================================
app.post("/api/crops/fertility", async (req, res) => {
  try {
    const response = await axios.post(
      `${FLASK_API_URL}/predict/fertility`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error calling Flask fertility API:", error.message);
    res.status(500).json({ error: "Failed to get fertility prediction" });
  }
});


// ====================================================================
//          💧 IRRIGATION (MOISTURE) PREDICTION — NEW IMPROVED
// ====================================================================
app.post("/api/crops/moisture", async (req, res) => {
  try {
    console.log("Backend received irrigation request:", req.body);

    const response = await axios.post(
      `${FLASK_API_URL}/predict/irrigation`,   // <-- NEW ENDPOINT
      req.body,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000, // 10 seconds
      }
    );

    console.log("Flask returned:", response.data);
    res.json(response.data);

  } catch (error) {
    console.error("Error calling Flask irrigation API:", error.message);

    if (error.response) {
      // Flask returned an error response
      console.error("Flask error:", error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Cannot connect to ML service. Make sure Flask is running on port 8000",
      });
    }

    res.status(500).json({
      error: "Failed to get irrigation prediction",
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
      timeout: 3000,
    });

    res.json({
      backend: "healthy",
      flask: flaskResponse.data,
    });

  } catch (error) {
    res.json({
      backend: "healthy",
      flask: "unavailable",
      error: error.message,
    });
  }
});

// Add this to smart-farming-app/backend/server.js

// ====================================================================
//                 📸 SOIL IMAGE CLASSIFICATION (ML MODEL)
// ====================================================================
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

// Configure multer for image uploads
const upload = multer({ dest: 'uploads/' });

app.post("/api/crops/soil-image", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log("Backend received soil image:", req.file);

    // Create form data to send to Flask
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Send to Flask API
    const response = await axios.post(
      `${FLASK_API_URL}/predict/soil-image`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 30000, // 30 seconds for image processing
      }
    );

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    console.log("Flask returned:", response.data);
    res.json(response.data);

  } catch (error) {
    console.error("Error calling Flask soil-image API:", error.message);

    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    if (error.response) {
      console.error("Flask error:", error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Cannot connect to ML service. Make sure Flask is running on port 8000",
      });
    }

    res.status(500).json({
      error: "Failed to analyze soil image",
      details: error.message,
    });
  }
});

// ====================================================================
//                           🚀 SERVER START
// ====================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
