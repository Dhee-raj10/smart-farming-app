"""
Train Soil Fertility Prediction Model
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import os

print("="*70)
print("TRAINING SOIL FERTILITY MODEL")
print("="*70)

# ==================== STEP 1: LOAD DATA ====================
print("\n📥 Loading dataset...")
df = pd.read_csv('datasets/soil_data.csv')
print(f"✅ Loaded {len(df)} samples")

# ==================== STEP 2: IDENTIFY COLUMNS ====================
print("\n🔍 Available columns:", df.columns.tolist())

# Feature columns - ADJUST THESE based on your dataset exploration
# Common variations: N, Nitrogen, n | P, Phosphorus, p | K, Potassium, k
feature_cols = []

# Try to find N, P, K columns
for col in df.columns:
    col_lower = col.lower()
    if any(x in col_lower for x in ['n', 'nitrogen', 'p', 'phosphorus', 'k', 'potassium', 
                                     'ph', 'ec', 'oc', 's', 'sulfur', 'zn', 'zinc', 
                                     'fe', 'iron', 'cu', 'copper', 'mn', 'manganese', 
                                     'b', 'boron']):
        if col not in feature_cols:
            feature_cols.append(col)

print(f"\n✅ Detected feature columns: {feature_cols}")

# Find target column
target_col = None
for col in df.columns:
    if any(x in col.lower() for x in ['fertility', 'output', 'class', 'target', 'label']):
        target_col = col
        break

if not target_col:
    print("❌ Could not automatically detect target column")
    print("Available columns:", df.columns.tolist())
    target_col = input("Please enter the target column name: ")

print(f"✅ Target column: {target_col}")

# ==================== STEP 3: PREPARE DATA ====================
X = df[feature_cols]
y = df[target_col]

# Handle categorical target
label_encoder = None
if y.dtype == 'object' or y.dtype == 'str':
    print(f"\n🔄 Encoding categorical target...")
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y)
    print(f"Encoded classes: {label_encoder.classes_}")

print(f"\n📊 Target distribution:")
print(pd.Series(y).value_counts())

# ==================== STEP 4: SPLIT DATA ====================
print(f"\n✂️ Splitting data (80% train, 20% test)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")

# ==================== STEP 5: SCALE FEATURES ====================
print(f"\n⚖️ Scaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ==================== STEP 6: TRAIN MODEL ====================
print(f"\n🔄 Training Random Forest model...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=10,
    min_samples_leaf=4,
    random_state=42,
    n_jobs=-1,
    class_weight='balanced'
)

model.fit(X_train_scaled, y_train)
print("✅ Training complete!")

# ==================== STEP 7: EVALUATE ====================
print(f"\n📊 Evaluating model...")
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n{'='*70}")
print(f"🎯 MODEL PERFORMANCE")
print(f"{'='*70}")
print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")

print(f"\n📋 Classification Report:")
if label_encoder:
    print(classification_report(y_test, y_pred, 
                                target_names=label_encoder.classes_))
else:
    print(classification_report(y_test, y_pred))

print(f"\n🔢 Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# Feature Importance
feature_importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print(f"\n⭐ Top 5 Important Features:")
print(feature_importance.head())

# ==================== STEP 8: SAVE MODEL ====================
print(f"\n💾 Saving model...")
os.makedirs('models', exist_ok=True)

joblib.dump(model, 'models/fertility_model.pkl')
joblib.dump(scaler, 'models/fertility_scaler.pkl')
joblib.dump(feature_cols, 'models/fertility_features.pkl')

if label_encoder:
    joblib.dump(label_encoder, 'models/fertility_label_encoder.pkl')

print("✅ Model saved successfully!")
print(f"\nSaved files:")
print(f"  - models/fertility_model.pkl")
print(f"  - models/fertility_scaler.pkl")
print(f"  - models/fertility_features.pkl")
if label_encoder:
    print(f"  - models/fertility_label_encoder.pkl")

# ==================== STEP 9: TEST PREDICTION ====================
print(f"\n{'='*70}")
print(f"🧪 TESTING PREDICTION")
print(f"{'='*70}")

# Create a sample prediction
sample_idx = 0
sample_X = X_test_scaled[sample_idx:sample_idx+1]
sample_pred = model.predict(sample_X)[0]
sample_proba = model.predict_proba(sample_X)[0]

print(f"\nSample Input:")
for i, feat in enumerate(feature_cols):
    print(f"  {feat}: {X_test.iloc[sample_idx][feat]}")

if label_encoder:
    print(f"\nPrediction: {label_encoder.inverse_transform([sample_pred])[0]}")
else:
    print(f"\nPrediction: {sample_pred}")

print(f"Confidence: {max(sample_proba)*100:.2f}%")
print(f"Probabilities: {sample_proba}")

print(f"\n{'='*70}")
print(f"✅ SOIL FERTILITY MODEL READY!")
print(f"{'='*70}")