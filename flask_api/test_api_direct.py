# flask_api/test_api_direct.py
"""
Test Flask API directly to find the issue
"""
import requests
import json
import joblib

print("="*70)
print("TESTING FLASK API DIRECTLY")
print("="*70)

# Step 1: Get expected features
print("\n1. Loading expected features...")
try:
    features = joblib.load('models/fertility_features.pkl')
    print(f"   Model expects: {features}")
except Exception as e:
    print(f"   Error: {e}")
    exit(1)

# Step 2: Create correct payload
print("\n2. Creating test payload...")
payload = {
    'N': 50,
    'P': 30,
    'K': 40,
    'pH': 6.5,
    'EC': 1.2,
    'OC': 0.8,
    'S': 12,
    'Zn': 3,
    'Fe': 15,
    'Cu': 2,
    'Mn': 8,
    'B': 1.5
}

# Only include features that the model actually expects
filtered_payload = {k: v for k, v in payload.items() if k in features}

print(f"   Sending: {filtered_payload}")

# Step 3: Test Flask endpoint
print("\n3. Testing Flask API...")
try:
    response = requests.post(
        'http://localhost:8000/predict/fertility',
        json=filtered_payload,
        headers={'Content-Type': 'application/json'},
        timeout=10
    )
    
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("   ✅ SUCCESS!")
        result = response.json()
        print(f"\n   Response:")
        print(f"   {json.dumps(result, indent=4)}")
    else:
        print(f"   ❌ FAILED!")
        print(f"   Response: {response.text}")
        
        # Try to parse error
        try:
            error_data = response.json()
            print(f"\n   Error details:")
            print(f"   {json.dumps(error_data, indent=4)}")
        except:
            pass
            
except requests.exceptions.ConnectionError:
    print("   ❌ Cannot connect to Flask API")
    print("   Make sure Flask is running: python app.py")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Step 4: Show what to send from frontend
print("\n" + "="*70)
print("FRONTEND SHOULD SEND THIS EXACT STRUCTURE:")
print("="*70)
print(json.dumps(filtered_payload, indent=2))
print("\nMake sure your formData in React matches these field names EXACTLY!")
print("="*70)