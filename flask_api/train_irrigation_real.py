# flask_api/train_irrigation_real.py
"""
Train Irrigation Model with Real Processed Data
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import os

print("="*70)
print("TRAINING IRRIGATION MODEL WITH REAL DATA")
print("="*70)

# Load data
print("\n1. Loading data...")
df = pd.read_csv('datasets/irrigation_data.csv')
print(f"✅ Loaded {len(df)} samples")

# Features and target
feature_cols = ['moisture0', 'moisture1', 'moisture2', 'moisture3', 'moisture4']
X = df[feature_cols]
y = df['irrigation_needed']

print(f"\n2. Dataset info:")
print(f"   Features: {feature_cols}")
print(f"   Irrigation needed: {(y==1).sum()} ({(y==1).sum()/len(y)*100:.1f}%)")

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"   Train: {len(X_train)}, Test: {len(X_test)}")

# Scale
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train models
print("\n3. Training models...")
models = {
    'Gradient Boosting': GradientBoostingClassifier(
        n_estimators=150, learning_rate=0.1, max_depth=5, 
        min_samples_split=10, min_samples_leaf=5, random_state=42
    ),
    'Random Forest': RandomForestClassifier(
        n_estimators=200, max_depth=15, min_samples_split=10,
        min_samples_leaf=4, random_state=42, n_jobs=-1
    )
}

best_model, best_accuracy, best_name = None, 0, ""
for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    accuracy = accuracy_score(y_test, model.predict(X_test_scaled))
    print(f"   {name}: {accuracy*100:.2f}%")
    if accuracy > best_accuracy:
        best_accuracy, best_model, best_name = accuracy, model, name

print(f"\n✅ Best: {best_name} ({best_accuracy*100:.2f}%)")

# Evaluate
print(f"\n{'='*70}")
print("MODEL PERFORMANCE")
print("="*70)
y_pred = best_model.predict(X_test_scaled)
print(classification_report(y_test, y_pred, target_names=['No Irrigation', 'Irrigation Needed']))

cm = confusion_matrix(y_test, y_pred)
print(f"\nConfusion Matrix:")
print(f"TN: {cm[0,0]} | FP: {cm[0,1]}")
print(f"FN: {cm[1,0]} | TP: {cm[1,1]}")

# Save
print("\n4. Saving model...")
os.makedirs('models', exist_ok=True)
joblib.dump(best_model, 'models/irrigation_model.pkl')
joblib.dump(scaler, 'models/irrigation_scaler.pkl')
joblib.dump(feature_cols, 'models/irrigation_features.pkl')
print("✅ Saved!")

# Test
print(f"\n{'='*70}")
print("TEST PREDICTIONS")
print("="*70)
tests = [
    {'name': '🚨 Critical', 'values': [15, 18, 12, 16, 14]},
    {'name': '⚠️ Low', 'values': [32, 35, 30, 33, 31]},
    {'name': '👍 Adequate', 'values': [48, 52, 46, 50, 49]},
    {'name': '✅ Optimal', 'values': [68, 72, 66, 70, 69]}
]

for test in tests:
    X_sample = scaler.transform([test['values']])
    pred = best_model.predict(X_sample)[0]
    proba = best_model.predict_proba(X_sample)[0]
    avg = np.mean(test['values'])
    print(f"\n{test['name']} (Avg: {avg:.1f}%)")
    print(f"  Prediction: {'🚰 IRRIGATION NEEDED' if pred == 1 else '✅ No irrigation'}")
    print(f"  Confidence: {max(proba)*100:.1f}%")

print(f"\n{'='*70}")
print("✅ COMPLETE! Restart Flask: python app.py")
print("="*70)