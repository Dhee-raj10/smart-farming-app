"""
Test the trained Soil Fertility model
"""
import joblib
import numpy as np

print("="*70)
print("TESTING SOIL FERTILITY MODEL")
print("="*70)

# Load model
print("\n📥 Loading model...")
model = joblib.load('models/fertility_model.pkl')
scaler = joblib.load('models/fertility_scaler.pkl')
features = joblib.load('models/fertility_features.pkl')

try:
    label_encoder = joblib.load('models/fertility_label_encoder.pkl')
except:
    label_encoder = None

print("✅ Model loaded successfully!")
print(f"\nFeatures required: {features}")

# Test cases
test_cases = [
    {
        'name': 'Low Fertility Soil',
        # Adjust these values based on your feature columns
        'values': [10, 5, 15, 5.0, 0.3, 0.2, 5, 0.5, 3, 0.5, 2, 0.3]
    },
    {
        'name': 'Medium Fertility Soil',
        'values': [45, 25, 40, 6.5, 1.2, 0.8, 12, 3, 12, 2.5, 8, 1.2]
    },
    {
        'name': 'High Fertility Soil',
        'values': [70, 45, 60, 6.8, 1.8, 1.5, 18, 5, 18, 4, 12, 2]
    }
]

for test in test_cases:
    print(f"\n{'='*70}")
    print(f"Test: {test['name']}")
    print(f"{'='*70}")
    
    # Adjust length of values to match features
    values = test['values'][:len(features)]
    if len(values) < len(features):
        # Pad with zeros if needed
        values.extend([0] * (len(features) - len(values)))
    
    X = np.array([values])
    X_scaled = scaler.transform(X)
    
    prediction = model.predict(X_scaled)[0]
    probabilities = model.predict_proba(X_scaled)[0]
    
    if label_encoder:
        pred_label = label_encoder.inverse_transform([prediction])[0]
    else:
        pred_label = prediction
    
    print(f"\nInput values:")
    for feat, val in zip(features, values):
        print(f"  {feat}: {val}")
    
    print(f"\n✅ Prediction: {pred_label}")
    print(f"Confidence: {max(probabilities)*100:.2f}%")
    print(f"Probabilities: {probabilities}")

print(f"\n{'='*70}")
print(f"✅ MODEL TESTING COMPLETE!")
print(f"{'='*70}")