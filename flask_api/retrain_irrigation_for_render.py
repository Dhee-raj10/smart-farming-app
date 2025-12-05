# flask_api/retrain_irrigation_for_render.py
"""
Retrain irrigation model with Render-compatible settings
This fixes the BitGenerator serialization issue
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

print("="*70)
print("RETRAINING IRRIGATION MODEL (RENDER COMPATIBLE)")
print("="*70)

# Load data
print("\n1. Loading irrigation data...")
if not os.path.exists('datasets/irrigation_data.csv'):
    print("❌ datasets/irrigation_data.csv not found!")
    print("Run: python process_drought_to_irrigation.py first")
    exit(1)

df = pd.read_csv('datasets/irrigation_data.csv')
print(f"✅ Loaded {len(df)} samples")

# Features and target
feature_cols = ['moisture0', 'moisture1', 'moisture2', 'moisture3', 'moisture4']
X = df[feature_cols]
y = df['irrigation_needed']

print(f"\n2. Dataset info:")
print(f"   Irrigation needed: {(y==1).sum()} ({(y==1).sum()/len(y)*100:.1f}%)")

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"   Train: {len(X_train)}, Test: {len(X_test)}")

# Scale
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train with FIXED random_state to avoid serialization issues
print("\n3. Training Gradient Boosting model...")
model = GradientBoostingClassifier(
    n_estimators=150,
    learning_rate=0.1,
    max_depth=5,
    min_samples_split=10,
    min_samples_leaf=5,
    random_state=42,  # FIXED random state
    verbose=0
)

model.fit(X_train_scaled, y_train)
print("✅ Training complete")

# Evaluate
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n{'='*70}")
print("MODEL PERFORMANCE")
print("="*70)
print(f"Accuracy: {accuracy*100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['No Irrigation', 'Irrigation']))

# Save with compatibility settings
print("\n4. Saving model with Render compatibility...")
os.makedirs('models', exist_ok=True)

# Save with protocol 4 for compatibility
import pickle
with open('models/irrigation_model.pkl', 'wb') as f:
    pickle.dump(model, f, protocol=4)

joblib.dump(scaler, 'models/irrigation_scaler.pkl', compress=3)
joblib.dump(feature_cols, 'models/irrigation_features.pkl', compress=3)

print("✅ Models saved!")

# Test loading
print("\n5. Testing model loading...")
try:
    with open('models/irrigation_model.pkl', 'rb') as f:
        test_model = pickle.load(f)
    test_scaler = joblib.load('models/irrigation_scaler.pkl')
    test_features = joblib.load('models/irrigation_features.pkl')
    print("✅ Models load successfully")
    
    # Test prediction
    sample = X_test_scaled[:1]
    pred = test_model.predict(sample)[0]
    proba = test_model.predict_proba(sample)[0]
    print(f"\nTest prediction: {pred}")
    print(f"Confidence: {max(proba)*100:.1f}%")
    
except Exception as e:
    print(f"❌ Error loading: {e}")

print(f"\n{'='*70}")
print("✅ COMPLETE! Upload to Google Drive and update download_models.py")
print("="*70)