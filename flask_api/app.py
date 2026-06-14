import os
import sys

# Download models on startup if needed
if not os.path.exists('models/fertility_model.pkl'):
    print("⚠️  Models not found. Downloading...")
    from download_models import download_models
    download_models()

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import json
from werkzeug.utils import secure_filename
import tensorflow as tf
from tensorflow import keras
from PIL import Image
import io

app = Flask(__name__)

# ====================================================================
#                    🔧 FIXED CORS CONFIGURATION
# ====================================================================
# ✅ ALLOW ALL ORIGINS FOR LOCAL DEVELOPMENT
CORS(app, 
     resources={
         r"/*": {
             "origins": "*",  # Allow all origins locally
             "methods": ["GET", "POST", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": False,
             "expose_headers": ["Content-Type"]
         }
     }
)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==================== LOAD MODELS ====================
print("🔄 Loading ML models...")

# Fertility model
try:
    fertility_model = joblib.load('models/fertility_model.pkl')
    fertility_scaler = joblib.load('models/fertility_scaler.pkl')
    fertility_features = joblib.load('models/fertility_features.pkl')
    try:
        fertility_encoder = joblib.load('models/fertility_label_encoder.pkl')
    except:
        fertility_encoder = None
    print("✅ Fertility model loaded")
except Exception as e:
    print(f"❌ Fertility model error: {e}")
    fertility_model = None

# Irrigation model
# Irrigation model - loaded from irrigation_assets/ (committed directly to repo)
try:
    import pickle

    # Try irrigation_assets/ first (committed to repo, always reliable)
    irrigation_paths = [
        ('irrigation_assets/irrigation_model.pkl',
         'irrigation_assets/irrigation_scaler.pkl',
         'irrigation_assets/irrigation_features.pkl'),
        ('models/irrigation_model.pkl',
         'models/irrigation_scaler.pkl',
         'models/irrigation_features.pkl'),
    ]

    irrigation_model = None
    for model_path, scaler_path, features_path in irrigation_paths:
        try:
            with open(model_path, 'rb') as f:
                irrigation_model = pickle.load(f)
            irrigation_scaler = joblib.load(scaler_path)
            irrigation_features = joblib.load(features_path)
            print(f"✅ Irrigation model loaded from {model_path}")
            break
        except Exception as inner_e:
            print(f"  ⚠️  Failed from {model_path}: {inner_e}")
            irrigation_model = None
            continue

    if irrigation_model is None:
        raise Exception("All irrigation model paths failed")

except Exception as e:
    print(f"⚠️  Irrigation model error: {e}")
    import traceback
    traceback.print_exc()
    irrigation_model = None

# Soil Image model
soil_image_model = None
soil_class_labels = None
soil_metadata = None
IMG_SIZE = 224

try:
    print("🔄 Loading soil image model...")
    
    model_paths = [
        'models/soil_image_model.keras',
        'models/soil_image_best.keras',
        'models/soil_image_model.h5',
        'models/soil_image_best.h5'
    ]
    
    model_loaded = False
    for model_path in model_paths:
        if os.path.exists(model_path):
            try:
                print(f"  Trying to load: {model_path}")
                soil_image_model = keras.models.load_model(model_path, compile=False)
                print(f"  ✅ Loaded: {model_path}")
                model_loaded = True
                break
            except Exception as e:
                print(f"  ❌ Failed to load {model_path}: {e}")
                continue
    
    if not model_loaded:
        raise FileNotFoundError("No soil image model found in any format")
    
    # Load class labels
    if os.path.exists('models/soil_class_labels.json'):
        with open('models/soil_class_labels.json', 'r') as f:
            soil_class_labels = json.load(f)
        print(f"  ✅ Loaded class labels: {list(soil_class_labels.values())}")
    else:
        soil_class_labels = {
            "0": "Alluvial Soil",
            "1": "Black Soil",
            "2": "Red Soil"
        }
        print("  ⚠️  Using default class labels")
    
    # Load metadata
    if os.path.exists('models/soil_model_metadata.json'):
        with open('models/soil_model_metadata.json', 'r') as f:
            soil_metadata = json.load(f)
        IMG_SIZE = soil_metadata.get('img_size', 224)
        print(f"  ✅ Loaded metadata (IMG_SIZE: {IMG_SIZE})")
    else:
        print("  ⚠️  Using default metadata")
    
    print("✅ Soil image model loaded successfully")
    
    # Warmup prediction
    try:
        dummy = np.zeros((1, IMG_SIZE, IMG_SIZE, 3), dtype=np.float32)
        soil_image_model.predict(dummy, verbose=0)
        print("✅ Warmup prediction complete")
    except Exception as w:
        print(f"⚠️  Warmup failed (non-critical): {w}")

    print("✅ Soil image model loaded successfully")
    
except Exception as e:
    print(f"❌ Soil image model error: {e}")
    import traceback
    traceback.print_exc()

print("="*70)
print("Flask ML API Ready!")
print(f"Models loaded: Fertility={fertility_model is not None}, Irrigation={irrigation_model is not None}, SoilImage={soil_image_model is not None}")
print("="*70)

# ==================== HELPER FUNCTIONS ====================
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_soil_characteristics(soil_type):
    """Return characteristics for soil type"""
    clean_name = soil_type.replace('_', ' ').strip()
    
    characteristics = {
        'Alluvial Soil': {
            'description': 'Rich in minerals, highly fertile',
            'color': '#8B7355',
            'texture': 'Fine to coarse',
            'best_crops': ['Rice', 'Wheat', 'Sugarcane', 'Cotton'],
            'pH_range': '6.5-7.5',
            'water_retention': 'Good',
            'fertility': 'High',
            'recommendations': [
                'Excellent for most crops',
                'Good water retention',
                'Add organic matter regularly',
                'Practice crop rotation'
            ]
        },
        'Black Soil': {
            'description': 'Cotton soil, rich in clay',
            'color': '#2C2416',
            'texture': 'Very fine, clayey',
            'best_crops': ['Cotton', 'Tobacco', 'Sugarcane', 'Wheat'],
            'pH_range': '7.2-8.5',
            'water_retention': 'Excellent',
            'fertility': 'High',
            'recommendations': [
                'Perfect for cotton',
                'High moisture retention',
                'Use drip irrigation',
                'Deep tillage recommended'
            ]
        },
        'Red Soil': {
            'description': 'Iron-rich, porous',
            'color': '#A0522D',
            'texture': 'Sandy to clay loam',
            'best_crops': ['Groundnut', 'Potato', 'Tobacco', 'Millets'],
            'pH_range': '5.0-7.0',
            'water_retention': 'Low to Medium',
            'fertility': 'Low to Medium',
            'recommendations': [
                'Add fertilizers regularly',
                'Increase organic matter',
                'Use mulching',
                'Consider drip irrigation'
            ]
        }
    }
    
    return characteristics.get(soil_type, characteristics.get(clean_name, {
        'description': f'Soil characteristics for {clean_name}',
        'color': '#8B7355',
        'texture': 'Variable',
        'best_crops': ['Consult local expert'],
        'pH_range': 'Variable',
        'water_retention': 'Variable',
        'fertility': 'Variable',
        'recommendations': ['Get soil tested']
    }))

# ==================== API ENDPOINTS ====================

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'Smart Farming ML API',
        'status': 'running',
        'version': '1.0',
        'endpoints': {
            'health': '/health',
            'fertility': '/predict/fertility',
            'irrigation': '/predict/irrigation',
            'soil_image': '/predict/soil-image'
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'message': 'Flask ML API is running',
        'models': {
            'fertility': fertility_model is not None,
            'irrigation': irrigation_model is not None,
            'soil_image': soil_image_model is not None
        }
    })

@app.route('/predict/fertility', methods=['POST', 'OPTIONS'])
def predict_fertility():
    """Predict soil fertility"""
    
    # Handle OPTIONS for CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    if not fertility_model:
        return jsonify({'error': 'Fertility model not loaded'}), 503
    
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data received'}), 400
        
        features = []
        for feature_name in fertility_features:
            if feature_name not in data:
                return jsonify({'error': f'Missing {feature_name}'}), 400
            features.append(float(data[feature_name]))
        
        X = np.array([features])
        X_scaled = fertility_scaler.transform(X)
        prediction = fertility_model.predict(X_scaled)[0]
        probabilities = fertility_model.predict_proba(X_scaled)[0]
        
        fertility_mapping = {0: 'Low', 1: 'Medium', 2: 'High'}
        pred_label = fertility_mapping.get(int(prediction), 'Unknown')
        confidence = float(max(probabilities))
        
        return jsonify({
            'success': True,
            'prediction': pred_label,
            'confidence': confidence,
            'confidence_percentage': f"{confidence*100:.1f}%",
            'probabilities': {
                'Low': float(probabilities[0]),
                'Medium': float(probabilities[1]),
                'High': float(probabilities[2])
            }
        })
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/predict/irrigation', methods=['POST', 'OPTIONS'])
def predict_irrigation():
    """Predict irrigation need"""
    
    # Handle OPTIONS for CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    if not irrigation_model:
        return jsonify({'error': 'Irrigation model not loaded'}), 503
    
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data received'}), 400
        
        features = []
        for feature_name in irrigation_features:
            if feature_name not in data:
                return jsonify({'error': f'Missing {feature_name}'}), 400
            features.append(float(data[feature_name]))
        
        X = np.array([features])
        X_scaled = irrigation_scaler.transform(X)
        prediction = irrigation_model.predict(X_scaled)[0]
        probability = irrigation_model.predict_proba(X_scaled)[0]
        
        confidence = float(max(probability))
        avg_moisture = float(np.mean(features))
        irrigation_needed = bool(prediction == 1)
        
        return jsonify({
            'success': True,
            'irrigationNeeded': irrigation_needed,
            'confidence': confidence,
            'confidence_percentage': f"{confidence*100:.1f}%",
            'average_moisture': avg_moisture,
            'recommendation': {
                'urgency': 'High' if avg_moisture < 30 else 'Medium' if avg_moisture < 50 else 'Low',
                'color': '#dc3545' if avg_moisture < 30 else '#ffc107' if avg_moisture < 50 else '#28a745'
            }
        })
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/predict/soil-image', methods=['POST', 'OPTIONS'])
def predict_soil_image():
    """Predict soil type from image"""
    
    # Handle OPTIONS request for CORS
    if request.method == 'OPTIONS':
        return '', 204
    
    print("\n" + "="*70)
    print("SOIL IMAGE PREDICTION REQUEST")
    print("="*70)
    
    if not soil_image_model:
        print("❌ Model not loaded")
        return jsonify({'error': 'Soil image model not loaded'}), 503
    
    try:
        print("📸 Checking for image file...")
        
        if 'image' not in request.files:
            print("❌ No image in request")
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            print("❌ Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            print(f"❌ Invalid file type: {file.filename}")
            return jsonify({'error': 'Invalid file type. Use JPG, JPEG, or PNG'}), 400
        
        print(f"✅ File received: {file.filename}")
        
        # Process image
        print("🔄 Processing image...")
        img_bytes = file.read()
        print(f"  Image size: {len(img_bytes)} bytes")
        
        img = Image.open(io.BytesIO(img_bytes))
        print(f"  Original size: {img.size}, Mode: {img.mode}")
        
        if img.mode != 'RGB':
            img = img.convert('RGB')
            print(f"  Converted to RGB")
        
        img = img.resize((IMG_SIZE, IMG_SIZE))
        print(f"  Resized to: {IMG_SIZE}x{IMG_SIZE}")
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0
        print(f"  Array shape: {img_array.shape}")
        
        # Predict
        print("🔄 Running prediction...")
        predictions = soil_image_model.predict(img_array, verbose=0)
        print(f"  Predictions shape: {predictions.shape}")
        print(f"  Raw predictions: {predictions[0]}")
        
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx])
        
        predicted_soil = soil_class_labels[str(predicted_idx)]
        print(f"  Predicted: {predicted_soil} (confidence: {confidence*100:.1f}%)")
        
        # Get top 3 predictions
        top_3_idx = np.argsort(predictions[0])[-3:][::-1]
        top_predictions = []
        for idx in top_3_idx:
            top_predictions.append({
                'soil_type': soil_class_labels[str(idx)],
                'confidence': float(predictions[0][idx]),
                'confidence_percentage': f"{predictions[0][idx]*100:.1f}%"
            })
        
        characteristics = get_soil_characteristics(predicted_soil)
        
        result = {
            'success': True,
            'prediction': predicted_soil,
            'confidence': confidence,
            'confidence_percentage': f"{confidence*100:.1f}%",
            'top_predictions': top_predictions,
            'characteristics': characteristics
        }
        
        print("✅ Prediction successful")
        print("="*70 + "\n")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        print("="*70 + "\n")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

# ==================== RUN SERVER ====================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print("\n" + "="*70)
    print(f"🚀 Starting Flask on http://localhost:{port}")
    print("🌐 CORS enabled for ALL origins (local development)")
    print("="*70 + "\n")
    app.run(host='0.0.0.0', port=port, debug=True)