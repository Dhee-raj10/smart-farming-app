# flask_api/fix_model.py
"""
Fix the fertility model by removing 'Output' from features
"""
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder

print("="*70)
print("FIXING FERTILITY MODEL")
print("="*70)

# Load dataset
print("\n1. Loading dataset...")
df = pd.read_csv('datasets/soil_data.csv')
print(f"   Loaded {len(df)} samples")
print(f"   Columns: {df.columns.tolist()}")

# Define CORRECT features (without Output)
feature_cols = ['N', 'P', 'K', 'pH', 'EC', 'OC', 'S', 'Zn', 'Fe', 'Cu', 'Mn', 'B']

# Check all features exist
missing = [f for f in feature_cols if f not in df.columns]
if missing:
    print(f"   ❌ Missing columns: {missing}")
    print(f"   Available columns: {df.columns.tolist()}")
    exit(1)

print(f"\n2. Using features: {feature_cols}")

# Find target column (Output)
target_col = 'Output'
if target_col not in df.columns:
    # Try to find it
    for col in ['output', 'fertility', 'Fertility', 'class', 'Class']:
        if col in df.columns:
            target_col = col
            break

print(f"   Target column: {target_col}")

# Prepare data
X = df[feature_cols]
y = df[target_col]

# Encode target if needed
label_encoder = None
if y.dtype == 'object':
    print(f"\n3. Encoding target...")
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y)
    print(f"   Classes: {label_encoder.classes_}")
else:
    print(f"\n3. Target is numeric: {y.unique()}")

# Split
print(f"\n4. Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scale
print(f"\n5. Scaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train
print(f"\n6. Training model...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=10,
    min_samples_leaf=4,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train_scaled, y_train)

# Evaluate
from sklearn.metrics import accuracy_score, classification_report

y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n{'='*70}")
print(f"MODEL PERFORMANCE")
print(f"{'='*70}")
print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")

if label_encoder:
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

# Save FIXED models
print(f"\n7. Saving FIXED models...")
joblib.dump(model, 'models/fertility_model.pkl')
joblib.dump(scaler, 'models/fertility_scaler.pkl')
joblib.dump(feature_cols, 'models/fertility_features.pkl')  # Without 'Output'!

if label_encoder:
    joblib.dump(label_encoder, 'models/fertility_label_encoder.pkl')

print(f"\n✅ FIXED MODEL SAVED!")
print(f"\nFeatures (without Output): {feature_cols}")

# Test prediction
print(f"\n8. Testing prediction...")
sample_data = {
    'N': 50, 'P': 30, 'K': 40, 'pH': 6.5,
    'EC': 1.2, 'OC': 0.8, 'S': 12, 'Zn': 3,
    'Fe': 15, 'Cu': 2, 'Mn': 8, 'B': 1.5
}

X_test_sample = np.array([[sample_data[f] for f in feature_cols]])
X_test_scaled = scaler.transform(X_test_sample)
prediction = model.predict(X_test_scaled)[0]
proba = model.predict_proba(X_test_scaled)[0]

if label_encoder:
    pred_label = label_encoder.inverse_transform([prediction])[0]
else:
    pred_label = prediction

print(f"   Input: {sample_data}")
print(f"   Prediction: {pred_label}")
print(f"   Confidence: {max(proba)*100:.2f}%")

print(f"\n{'='*70}")
print(f"✅ MODEL FIXED AND READY!")
print(f"{'='*70}")