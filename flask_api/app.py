# flask_api/app.py
"""
Complete Flask ML API for Smart Farming Application
FIXED: Added root route and improved error handling
"""
import os
import sys

# Download models on startup if they don't exist
if not os.path.exists('models/fertility_model.pkl'):
    print("⚠️  Models not found. Downloading from cloud storage...")
    from download_models import download_models
    download_models()

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import json
from werkzeug.utils import secure_filename

# For image processing
import tensorflow as tf
from tensorflow import keras
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

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

# Irrigation model - WITH ERROR HANDLING
try:
    import pickle
    # Try loading with different protocols
    try:
        with open('models/irrigation_model.pkl', 'rb') as f:
            irrigation_model = pickle.load(f)
    except:
        irrigation_model = joblib.load('models/irrigation_model.pkl', mmap_mode=None)
    
    irrigation_scaler = joblib.load('models/irrigation_scaler.pkl')
    irrigation_features = joblib.load('models/irrigation_features.pkl')
    print("✅ Irrigation model loaded")
except Exception as e:
    print(f"⚠️  Irrigation model not loaded: {e}")
    irrigation_model = None

# Soil Image Classification model
try:
    if os.path.exists('models/soil_image_model.keras'):
        soil_image_model = keras.models.load_model('models/soil_image_model.keras')
        print("✅ Loaded soil model from .keras format")
    elif os.path.exists('models/soil_image_best.keras'):
        soil_image_model = keras.models.load_model('models/soil_image_best.keras')
        print("✅ Loaded soil model from soil_image_best.keras")
    elif os.path.exists('models/soil_image_model.h5'):
        soil_image_model = keras.models.load_model('models/soil_image_model.h5')
        print("✅ Loaded soil model from .h5 format")
    else:
        raise FileNotFoundError("No soil model found")
    
    with open('models/soil_class_labels.json', 'r') as f:
        soil_class_labels = json.load(f)
    
    with open('models/soil_model_metadata.json', 'r') as f:
        soil_metadata = json.load(f)
    
    IMG_SIZE = soil_metadata['img_size']
    print("✅ Soil image classification model loaded")
    print(f"   Classes: {list(soil_class_labels.values())}")
    print(f"   Accuracy: {soil_metadata.get('val_accuracy', 0)*100:.1f}%")
except Exception as e:
    print(f"⚠️  Soil image model not loaded: {e}")
    soil_image_model = None
    IMG_SIZE = 224

print("="*70)
print("Flask ML API Ready on http://127.0.0.1:8000")
print("="*70)

# ==================== HELPER FUNCTIONS ====================

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_soil_characteristics(soil_type):
    """Return characteristics and recommendations for each soil type"""
    clean_name = soil_type.replace('_', ' ')
    
    characteristics = {
        'Alluvial Soil': {
            'description': 'Rich in minerals, highly fertile, found near river banks',
            'color': '#8B7355',
            'texture': 'Fine to coarse, well-balanced',
            'best_crops': ['Rice', 'Wheat', 'Sugarcane', 'Cotton', 'Jute', 'Vegetables'],
            'pH_range': '6.5-7.5',
            'water_retention': 'Good',
            'fertility': 'High',
            'recommendations': [
                'Excellent for most crops due to high fertility',
                'Good water retention capacity',
                'Add organic matter to maintain soil structure',
                'Practice crop rotation for sustained productivity',
                'Regular irrigation during dry periods'
            ]
        },
        'Black Soil': {
            'description': 'Cotton soil, rich in clay, excellent moisture retention',
            'color': '#2C2416',
            'texture': 'Very fine, clayey',
            'best_crops': ['Cotton', 'Tobacco', 'Sugarcane', 'Wheat', 'Jowar', 'Citrus'],
            'pH_range': '7.2-8.5',
            'water_retention': 'Excellent',
            'fertility': 'High',
            'recommendations': [
                'Perfect for cotton cultivation',
                'High moisture retention - use drip irrigation',
                'Add lime if pH becomes too alkaline',
                'Deep tillage recommended for better aeration',
                'Suitable for rain-fed farming'
            ]
        },
        'Red Soil': {
            'description': 'Iron-rich, porous, good for groundnuts and potatoes',
            'color': '#A0522D',
            'texture': 'Sandy to clay loam',
            'best_crops': ['Groundnut', 'Potato', 'Tobacco', 'Millets', 'Pulses', 'Vegetables'],
            'pH_range': '5.0-7.0',
            'water_retention': 'Low to Medium',
            'fertility': 'Low to Medium',
            'recommendations': [
                'Add fertilizers to boost nitrogen levels',
                'Increase organic matter content regularly',
                'Mulching recommended to retain moisture',
                'Consider drip irrigation for water efficiency',
                'Add lime to reduce acidity if pH is below 5.5'
            ]
        }
    }
    
    # Return for both underscore and space versions
    return characteristics.get(soil_type, characteristics.get(clean_name, {
        'description': f'Soil characteristics for {clean_name}',
        'color': '#8B7355',
        'texture': 'Variable',
        'best_crops': ['Consult local agricultural expert'],
        'pH_range': 'Variable',
        'water_retention': 'Variable',
        'fertility': 'Variable',
        'recommendations': [
            'Get soil tested for detailed analysis',
            'Consult local agricultural extension office',
            'Add organic matter regularly',
            'Monitor soil pH and nutrients'
        ]
    }))

def get_fertility_recommendation(pred_label, confidence, nutrient_values):
    """Generate detailed fertility recommendations"""
    recommendations = {
        'Low': {
            'message': '⚠️ Your soil fertility is LOW. Immediate action required!',
            'priority': 'High',
            'color': '#dc3545',
            'actions': [
                'Apply organic compost (5-10 tons/hectare)',
                'Use balanced NPK fertilizer (19:19:19) at 200-250 kg/hectare',
                'Add micronutrients: Zinc sulfate (25 kg/ha), Ferrous sulfate (25 kg/ha)',
                'Adjust pH to 6.0-7.0 range using lime if acidic',
                'Incorporate green manure crops (legumes) before main crop'
            ],
            'timeline': 'Implement within 2 weeks before planting'
        },
        'Medium': {
            'message': '👍 Your soil fertility is MEDIUM. Good base, can be optimized.',
            'priority': 'Medium',
            'color': '#ffc107',
            'actions': [
                'Maintain with organic matter (2-3 tons/hectare)',
                'Apply targeted fertilizers based on specific crop needs',
                'Monitor nutrient levels quarterly with soil testing',
                'Practice crop rotation with nitrogen-fixing legumes',
                'Consider vermicompost (1-2 tons/ha) for micronutrient boost'
            ],
            'timeline': 'Implement within 1 month'
        },
        'High': {
            'message': '✅ Excellent! Your soil fertility is HIGH.',
            'priority': 'Low',
            'color': '#28a745',
            'actions': [
                'Maintain current excellent practices',
                'Continue organic matter addition (1-2 tons/hectare annually)',
                'Regular soil testing every 6 months to monitor levels',
                'Watch for over-fertilization symptoms',
                'Focus on maintaining soil structure and microbial health'
            ],
            'timeline': 'Maintain current schedule'
        }
    }
    return recommendations.get(pred_label, recommendations['Medium'])

def get_irrigation_recommendation(irrigation_needed, confidence, moisture_avg):
    """Generate irrigation recommendations"""
    if irrigation_needed:
        if moisture_avg < 20:
            return {
                'urgency': 'Critical',
                'color': '#dc3545',
                'action': '🚨 IRRIGATE IMMEDIATELY - Crops under severe stress!',
                'amount': '50-75mm water depth (deep irrigation)',
                'method': 'Flood or sprinkler irrigation recommended',
                'next_check': '12 hours',
                'timeline': 'Within 2 hours'
            }
        elif moisture_avg < 35:
            return {
                'urgency': 'High',
                'color': '#fd7e14',
                'action': '⚠️ Irrigate within 24 hours to prevent crop stress',
                'amount': '30-50mm water depth',
                'method': 'Drip or sprinkler irrigation',
                'next_check': '24 hours',
                'timeline': 'Within 24 hours'
            }
        else:
            return {
                'urgency': 'Moderate',
                'color': '#ffc107',
                'action': '📅 Schedule irrigation within 48 hours',
                'amount': '20-30mm water depth',
                'method': 'Drip irrigation preferred',
                'next_check': '48 hours',
                'timeline': 'Within 2 days'
            }
    else:
        if moisture_avg > 70:
            return {
                'urgency': 'None',
                'color': '#28a745',
                'action': '✅ Soil moisture is OPTIMAL. No irrigation needed.',
                'amount': 'Monitor only',
                'method': 'Continue current schedule',
                'next_check': '3-4 days',
                'timeline': 'No action required'
            }
        else:
            return {
                'urgency': 'Low',
                'color': '#17a2b8',
                'action': '👍 Soil moisture is adequate. Monitor daily.',
                'amount': 'No irrigation needed yet',
                'method': 'Check sensors daily',
                'next_check': '48-72 hours',
                'timeline': 'Irrigate when below 45%'
            }

# ==================== API ENDPOINTS ====================

@app.route('/', methods=['GET'])
def root():
    """Root endpoint - Welcome message"""
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
    """Health check endpoint"""
    models_status = {
        'fertility': fertility_model is not None,
        'irrigation': irrigation_model is not None,
        'soil_image': soil_image_model is not None
    }
    
    return jsonify({
        'status': 'healthy',
        'message': 'Flask ML API is running',
        'models': models_status,
        'all_models_loaded': all(models_status.values())
    })

@app.route('/predict/soil-image', methods=['POST'])
def predict_soil_image():
    """Predict soil type from uploaded image"""
    if not soil_image_model:
        return jsonify({'error': 'Soil image model not loaded'}), 503
    
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Use PNG, JPG, or JPEG'}), 400
        
        # Read and preprocess image
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes))
        
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        img = img.resize((IMG_SIZE, IMG_SIZE))
        img_array = keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0
        
        # Make prediction
        predictions = soil_image_model.predict(img_array, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx])
        
        predicted_soil_type = soil_class_labels[str(predicted_class_idx)]
        
        # Get top 3 predictions
        top_3_idx = np.argsort(predictions[0])[-3:][::-1]
        top_predictions = []
        for idx in top_3_idx:
            top_predictions.append({
                'soil_type': soil_class_labels[str(idx)],
                'confidence': float(predictions[0][idx]),
                'confidence_percentage': f"{predictions[0][idx]*100:.1f}%"
            })
        
        characteristics = get_soil_characteristics(predicted_soil_type)
        
        return jsonify({
            'success': True,
            'prediction': predicted_soil_type,
            'confidence': confidence,
            'confidence_percentage': f"{confidence*100:.1f}%",
            'top_predictions': top_predictions,
            'characteristics': characteristics
        })
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/predict/fertility', methods=['POST'])
def predict_fertility():
    """Predict soil fertility from nutrient values"""
    if not fertility_model:
        return jsonify({'error': 'Fertility model not loaded'}), 503
    
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data received'}), 400
        
        features = []
        missing_features = []
        
        for feature_name in fertility_features:
            if feature_name not in data:
                missing_features.append(feature_name)
            else:
                try:
                    features.append(float(data[feature_name]))
                except (ValueError, TypeError):
                    return jsonify({'error': f'Invalid value for {feature_name}'}), 400
        
        if missing_features:
            return jsonify({'error': f'Missing features: {missing_features}'}), 400
        
        X = np.array([features])
        X_scaled = fertility_scaler.transform(X)
        prediction = fertility_model.predict(X_scaled)[0]
        probabilities = fertility_model.predict_proba(X_scaled)[0]
        
        fertility_mapping = {0: 'Low', 1: 'Medium', 2: 'High'}
        pred_label = fertility_mapping.get(int(prediction), 'Unknown')
        confidence = float(max(probabilities))
        
        recommendation = get_fertility_recommendation(pred_label, confidence, features)
        
        n, p, k = features[0], features[1], features[2]
        nutrient_status = {
            'N': {
                'value': float(n),
                'level': 'Low' if n < 280 else 'Medium' if n < 420 else 'High',
                'status': 'Sufficient' if 280 <= n <= 560 else 'Needs attention',
                'optimal_range': '280-560 kg/ha'
            },
            'P': {
                'value': float(p),
                'level': 'Low' if p < 11 else 'Medium' if p < 22 else 'High',
                'status': 'Sufficient' if 11 <= p <= 45 else 'Needs attention',
                'optimal_range': '11-45 kg/ha'
            },
            'K': {
                'value': float(k),
                'level': 'Low' if k < 110 else 'Medium' if k < 280 else 'High',
                'status': 'Sufficient' if 110 <= k <= 560 else 'Needs attention',
                'optimal_range': '110-560 kg/ha'
            }
        }
        
        return jsonify({
            'success': True,
            'prediction': pred_label,
            'confidence': confidence,
            'confidence_percentage': f"{confidence*100:.1f}%",
            'probabilities': {
                'Low': float(probabilities[0]),
                'Medium': float(probabilities[1]),
                'High': float(probabilities[2])
            },
            'recommendation': recommendation,
            'nutrient_analysis': nutrient_status,
            'input_values': {name: val for name, val in zip(fertility_features, features)}
        })
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/predict/irrigation', methods=['POST'])
def predict_irrigation():
    """Predict irrigation need"""
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
        
        recommendation = get_irrigation_recommendation(irrigation_needed, confidence, avg_moisture)
        
        return jsonify({
            'success': True,
            'irrigationNeeded': irrigation_needed,
            'confidence': confidence,
            'confidence_percentage': f"{confidence*100:.1f}%",
            'average_moisture': avg_moisture,
            'sensor_readings': {f'sensor{i+1}': float(val) for i, val in enumerate(features)},
            'recommendation': recommendation
        })
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== RUN SERVER ====================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)