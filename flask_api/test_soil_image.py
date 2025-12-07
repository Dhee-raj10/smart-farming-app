"""
Test Soil Image Classification API
Run this from flask_api directory to diagnose issues
"""
import requests
import os
import sys

print("="*70)
print("TESTING SOIL IMAGE CLASSIFICATION API")
print("="*70)

# Test 1: Health check
print("\n1. Testing health endpoint...")
try:
    response = requests.get("http://localhost:8000/health", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ API is healthy")
        print(f"   Soil Image Model: {data['models'].get('soil_image', False)}")
        
        if not data['models'].get('soil_image'):
            print("\n   ❌ PROBLEM: Soil image model not loaded!")
            print("   Solutions:")
            print("   1. Check if model files exist:")
            print("      ls -la models/soil_image*")
            print("   2. Check Flask startup logs for errors")
            print("   3. Run: python download_models.py")
            sys.exit(1)
    else:
        print(f"   ❌ Status: {response.status_code}")
        sys.exit(1)
except requests.exceptions.ConnectionError:
    print("   ❌ Cannot connect. Is Flask running?")
    print("   Run: python app.py")
    sys.exit(1)

# Test 2: Check if test image exists
print("\n2. Looking for test image...")
test_images = []

# Look in common locations
search_paths = [
    'datasets/soil_images',
    'uploads',
    '.'
]

for path in search_paths:
    if os.path.exists(path):
        for root, dirs, files in os.walk(path):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    test_images.append(os.path.join(root, file))
                    if len(test_images) >= 3:
                        break
            if len(test_images) >= 3:
                break

if not test_images:
    print("   ❌ No test images found!")
    print("   Create a test image or download one")
    sys.exit(1)

test_image = test_images[0]
print(f"   ✅ Using: {test_image}")

# Test 3: Test prediction
print("\n3. Testing prediction...")
try:
    with open(test_image, 'rb') as f:
        files = {'image': (os.path.basename(test_image), f, 'image/jpeg')}
        
        print(f"   Sending request to http://localhost:8000/predict/soil-image")
        response = requests.post(
            "http://localhost:8000/predict/soil-image",
            files=files,
            timeout=30
        )
        
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n   ✅ PREDICTION SUCCESSFUL!")
        print(f"   Predicted Soil: {result['prediction']}")
        print(f"   Confidence: {result['confidence_percentage']}")
        print(f"\n   Top 3 Predictions:")
        for i, pred in enumerate(result['top_predictions'], 1):
            print(f"      {i}. {pred['soil_type']}: {pred['confidence_percentage']}")
    else:
        print(f"\n   ❌ FAILED!")
        print(f"   Response: {response.text}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Test backend proxy
print("\n4. Testing backend proxy (port 5000)...")
try:
    with open(test_image, 'rb') as f:
        files = {'image': (os.path.basename(test_image), f, 'image/jpeg')}
        
        response = requests.post(
            "http://localhost:5000/api/crops/soil-image",
            files=files,
            timeout=30
        )
    
    if response.status_code == 200:
        print("   ✅ Backend proxy works!")
    else:
        print(f"   ❌ Backend returned: {response.status_code}")
        print(f"   Response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("   ⚠️  Backend not running")
    print("   Start with: cd backend && npm start")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "="*70)
print("TESTING COMPLETE")
print("="*70)

print("\nDIAGNOSTICS:")
print("1. If model not loaded:")
print("   - Check models folder: ls -la models/")
print("   - Re-download models: python download_models.py")
print("   - Check Flask logs for model loading errors")
print("\n2. If prediction fails:")
print("   - Check image format (JPG/PNG)")
print("   - Check image file size (< 16MB)")
print("   - Check Flask logs during prediction")
print("\n3. If deployed on Render:")
print("   - Check Render logs for both Flask and Backend")
print("   - Verify FLASK_API_URL in backend environment")
print("   - Test health endpoint: curl https://your-flask-url/health")
print("="*70)