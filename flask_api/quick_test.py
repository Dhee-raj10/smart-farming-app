# flask_api/quick_test.py
"""
Quick test to diagnose fertility prediction issue
Run this to check everything is working
"""

import os
import sys

print("="*70)
print("QUICK FERTILITY PREDICTION TEST")
print("="*70)

# Step 1: Check if we're in the right directory
print("\n1. Checking current directory...")
print(f"   Current dir: {os.getcwd()}")
if not os.path.exists('models'):
    print("   ❌ 'models' folder not found!")
    print("   Make sure you're running from flask_api directory")
    print("   Run: cd flask_api")
    sys.exit(1)
else:
    print("   ✅ models folder exists")

# Step 2: Check model files
print("\n2. Checking model files...")
required_files = [
    'models/fertility_model.pkl',
    'models/fertility_scaler.pkl',
    'models/fertility_features.pkl'
]

missing_files = []
for filepath in required_files:
    if os.path.exists(filepath):
        size = os.path.getsize(filepath) / 1024  # Size in KB
        print(f"   ✅ {filepath} ({size:.2f} KB)")
    else:
        print(f"   ❌ {filepath} MISSING!")
        missing_files.append(filepath)

if missing_files:
    print("\n   ⚠️  Some model files are missing!")
    print("   Solution: Run training script")
    print("   Command: python train_fertility.py")
    sys.exit(1)

# Step 3: Try loading models
print("\n3. Loading models...")
try:
    import joblib
    import numpy as np
    
    model = joblib.load('models/fertility_model.pkl')
    print("   ✅ Model loaded")
    
    scaler = joblib.load('models/fertility_scaler.pkl')
    print("   ✅ Scaler loaded")
    
    features = joblib.load('models/fertility_features.pkl')
    print(f"   ✅ Features loaded: {features}")
    
    # Check if label encoder exists
    try:
        encoder = joblib.load('models/fertility_label_encoder.pkl')
        print("   ✅ Label encoder loaded")
    except:
        encoder = None
        print("   ℹ️  No label encoder (numeric classes)")
    
except Exception as e:
    print(f"   ❌ Error loading models: {e}")
    sys.exit(1)

# Step 4: Test prediction with sample data
print("\n4. Testing prediction with sample data...")
try:
    # Create sample input (adjust based on your features)
    sample_data = {
        'N': 50.0,
        'P': 30.0,
        'K': 40.0,
        'pH': 6.5,
        'EC': 1.2,
        'OC': 0.8,
        'S': 12.0,
        'Zn': 3.0,
        'Fe': 15.0,
        'Cu': 2.0,
        'Mn': 8.0,
        'B': 1.5
    }
    
    # Extract features in correct order
    values = []
    print("\n   Input values:")
    for feat in features:
        if feat in sample_data:
            values.append(sample_data[feat])
            print(f"      {feat}: {sample_data[feat]}")
        else:
            print(f"      ⚠️  {feat}: NOT IN SAMPLE DATA")
            values.append(0)  # Default to 0
    
    # Make prediction
    X = np.array([values])
    X_scaled = scaler.transform(X)
    prediction = model.predict(X_scaled)[0]
    probabilities = model.predict_proba(X_scaled)[0]
    
    # Decode if encoder exists
    if encoder:
        pred_label = encoder.inverse_transform([prediction])[0]
    else:
        pred_label = prediction
    
    print(f"\n   ✅ PREDICTION SUCCESSFUL!")
    print(f"      Predicted class: {pred_label}")
    print(f"      Confidence: {max(probabilities)*100:.2f}%")
    print(f"      Probabilities: {probabilities}")
    
except Exception as e:
    print(f"   ❌ Prediction failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 5: Test Flask endpoint if Flask is running
print("\n5. Testing Flask endpoint...")
try:
    import requests
    
    response = requests.get('http://localhost:8000/health', timeout=2)
    if response.status_code == 200:
        print("   ✅ Flask API is running")
        
        # Try the fertility endpoint
        print("\n   Testing /predict/fertility endpoint...")
        fertility_response = requests.post(
            'http://localhost:8000/predict/fertility',
            json=sample_data,
            timeout=5
        )
        
        if fertility_response.status_code == 200:
            result = fertility_response.json()
            print("   ✅ Fertility endpoint works!")
            print(f"      Response: {result}")
        else:
            print(f"   ❌ Fertility endpoint returned status {fertility_response.status_code}")
            print(f"      Error: {fertility_response.text}")
    else:
        print(f"   ⚠️  Flask returned status {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print("   ⚠️  Flask API is NOT running")
    print("      Start it with: python app.py")
except Exception as e:
    print(f"   ❌ Error testing Flask: {e}")

# Step 6: Check backend proxy
print("\n6. Testing backend proxy...")
try:
    import requests
    
    response = requests.post(
        'http://localhost:5000/api/crops/fertility',
        json=sample_data,
        timeout=5
    )
    
    if response.status_code == 200:
        print("   ✅ Backend proxy works!")
        result = response.json()
        print(f"      Response: {result}")
    else:
        print(f"   ❌ Backend returned status {response.status_code}")
        print(f"      Error: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("   ⚠️  Backend is NOT running")
    print("      Start it with: cd backend && npm start")
except Exception as e:
    print(f"   ❌ Error testing backend: {e}")

print("\n" + "="*70)
print("DIAGNOSTIC COMPLETE")
print("="*70)

print("\n📋 Summary:")
print("   1. Model files: ✅")
print("   2. Model loading: ✅")
print("   3. Prediction test: ✅")
print("   4. Flask API: Check above")
print("   5. Backend proxy: Check above")

print("\n💡 If Flask or Backend tests failed:")
print("   - Make sure Flask is running: cd flask_api && python app.py")
print("   - Make sure Backend is running: cd backend && npm start")
print("\n🎯 If everything passed, try the frontend again!")