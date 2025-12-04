from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Simple rule-based fertility prediction (replace with actual ML model)
@app.route('/predict/fertility', methods=['POST'])
def predict_fertility():
    try:
        data = request.json
        
        # Extract parameters
        N = float(data.get('N', 0))
        P = float(data.get('P', 0))
        K = float(data.get('K', 0))
        pH = float(data.get('pH', 0))
        EC = float(data.get('EC', 0))
        OC = float(data.get('OC', 0))
        S = float(data.get('S', 0))
        Zn = float(data.get('Zn', 0))
        Fe = float(data.get('Fe', 0))
        Cu = float(data.get('Cu', 0))
        Mn = float(data.get('Mn', 0))
        B = float(data.get('B', 0))
        
        # Simple rule-based classification
        # You should replace this with your actual ML model
        fertility_score = 0
        
        # Check NPK levels
        if 20 <= N <= 80:
            fertility_score += 2
        if 10 <= P <= 50:
            fertility_score += 2
        if 20 <= K <= 100:
            fertility_score += 2
        
        # Check pH
        if 6.0 <= pH <= 7.5:
            fertility_score += 2
        
        # Check other nutrients
        if EC > 0.5:
            fertility_score += 1
        if OC > 0.5:
            fertility_score += 1
        if S > 5:
            fertility_score += 1
        if Zn > 2:
            fertility_score += 1
        
        # Classify based on score
        if fertility_score >= 10:
            prediction = "High"
            recommendation = "Your soil has excellent fertility! Maintain current nutrient levels with regular organic matter addition."
        elif fertility_score >= 6:
            prediction = "Medium"
            recommendation = "Your soil has good fertility. Consider adding compost and balanced fertilizers to optimize nutrient levels."
        else:
            prediction = "Low"
            recommendation = "Your soil needs improvement. Add organic matter, check pH levels, and apply appropriate fertilizers based on soil test."
        
        return jsonify({
            'prediction': prediction,
            'recommendation': recommendation,
            'fertility_score': fertility_score
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Simple rule-based irrigation prediction
@app.route('/predict/moisture', methods=['POST'])
def predict_moisture():
    try:
        data = request.json
        
        # Extract moisture readings
        moisture0 = float(data.get('moisture0', 0))
        moisture1 = float(data.get('moisture1', 0))
        moisture2 = float(data.get('moisture2', 0))
        moisture3 = float(data.get('moisture3', 0))
        moisture4 = float(data.get('moisture4', 0))
        
        # Calculate average moisture
        avg_moisture = (moisture0 + moisture1 + moisture2 + moisture3 + moisture4) / 5
        
        # Determine irrigation need
        if avg_moisture < 30:
            irrigation_needed = True
            recommendation = f"Urgent irrigation required! Average soil moisture is {avg_moisture:.1f}%, which is critically low. Water immediately to prevent crop stress."
        elif avg_moisture < 50:
            irrigation_needed = True
            recommendation = f"Irrigation recommended. Average soil moisture is {avg_moisture:.1f}%. Schedule watering within the next 24 hours."
        elif avg_moisture < 70:
            irrigation_needed = False
            recommendation = f"Soil moisture is adequate at {avg_moisture:.1f}%. Monitor daily and irrigate when it drops below 50%."
        else:
            irrigation_needed = False
            recommendation = f"Soil moisture is optimal at {avg_moisture:.1f}%. No irrigation needed. Continue monitoring."
        
        return jsonify({
            'irrigationNeeded': irrigation_needed,
            'recommendation': recommendation,
            'average_moisture': round(avg_moisture, 1),
            'sensor_readings': {
                'sensor1': moisture0,
                'sensor2': moisture1,
                'sensor3': moisture2,
                'sensor4': moisture3,
                'sensor5': moisture4
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Flask ML API is running'})

if __name__ == '__main__':
    print("Starting Flask ML API on http://127.0.0.1:8000")
    app.run(host='127.0.0.1', port=8000, debug=True)