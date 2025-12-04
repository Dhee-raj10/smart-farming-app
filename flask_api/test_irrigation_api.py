# flask_api/test_irrigation_api.py
"""
Test Irrigation API endpoints
"""
import requests
import json

print("="*70)
print("TESTING IRRIGATION API")
print("="*70)

BASE_URL = "http://localhost:8000"

# Test 1: Health check
print("\n1. Testing health endpoint...")
try:
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ API is healthy")
        print(f"   Irrigation model loaded: {data['models'].get('irrigation', False)}")
    else:
        print(f"   ❌ Status: {response.status_code}")
except requests.exceptions.ConnectionError:
    print("   ❌ Cannot connect. Is Flask running? (python app.py)")
    exit(1)

# Test 2: Irrigation prediction
print("\n2. Testing irrigation prediction...")

test_cases = [
    {
        'name': 'Very Dry Soil',
        'data': {'moisture0': 20, 'moisture1': 22, 'moisture2': 18, 'moisture3': 21, 'moisture4': 19},
        'expected': 'Irrigation NEEDED'
    },
    {
        'name': 'Adequate Moisture',
        'data': {'moisture0': 50, 'moisture1': 52, 'moisture2': 48, 'moisture3': 51, 'moisture4': 49},
        'expected': 'No irrigation'
    },
    {
        'name': 'Optimal Moisture',
        'data': {'moisture0': 70, 'moisture1': 72, 'moisture2': 68, 'moisture3': 71, 'moisture4': 69},
        'expected': 'No irrigation'
    }
]

for test in test_cases:
    print(f"\n   Testing: {test['name']}")
    print(f"   Input: {test['data']}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/predict/irrigation",
            json=test['data'],
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Status: 200 OK")
            print(f"   Prediction: {'Irrigation NEEDED' if result['irrigationNeeded'] else 'No irrigation'}")
            print(f"   Confidence: {result['confidence_percentage']}")
            print(f"   Average moisture: {result['average_moisture']:.1f}%")
            print(f"   Urgency: {result['recommendation']['urgency']}")
        else:
            print(f"   ❌ Status: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

# Test 3: Backend proxy
print("\n3. Testing backend proxy (port 5000)...")
try:
    response = requests.post(
        "http://localhost:5000/api/crops/moisture",
        json={'moisture0': 35, 'moisture1': 38, 'moisture2': 33, 'moisture3': 36, 'moisture4': 34},
        headers={'Content-Type': 'application/json'},
        timeout=10
    )
    
    if response.status_code == 200:
        print("   ✅ Backend proxy works!")
    else:
        print(f"   ❌ Backend returned: {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print("   ⚠️  Backend not running (npm start in backend folder)")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "="*70)
print("TESTING COMPLETE")
print("="*70)
print("\nIf all tests passed:")
print("  ✅ Flask API is working")
print("  ✅ Model predictions work")
print("  ✅ Ready to test in browser!")
print("\nGo to: http://localhost:3000/irrigation-prediction")
print("="*70)