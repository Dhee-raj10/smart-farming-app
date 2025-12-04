# flask_api/process_any_drought_data.py
"""
Smart processor that finds and uses ANY drought dataset
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import os

print("="*70)
print("SMART DROUGHT DATA PROCESSOR")
print("="*70)

# ==================== FIND DATASET ====================
print("\n1. Looking for drought dataset...")

if not os.path.exists('datasets'):
    print("❌ 'datasets' folder not found!")
    print("Please create it: mkdir datasets")
    exit(1)

csv_files = [f for f in os.listdir('datasets') if f.endswith('.csv')]
print(f"Found {len(csv_files)} CSV files: {csv_files}")

# Try each CSV file
drought_file = None
df = None

for csv_file in csv_files:
    if csv_file in ['soil_data.csv', 'irrigation_data.csv']:
        continue  # Skip these
    
    try:
        print(f"\nTrying: {csv_file}")
        test_df = pd.read_csv(f'datasets/{csv_file}')
        
        # Check if it has drought dataset columns
        required = ['CULTRF_LAND', 'CULTIR_LAND']
        if all(col in test_df.columns for col in required):
            print(f"✅ Found drought dataset: {csv_file}")
            drought_file = csv_file
            df = test_df
            break
        else:
            print(f"   Not drought dataset (missing columns)")
    except Exception as e:
        print(f"   Error: {e}")

if df is None:
    print("\n❌ Could not find drought dataset!")
    print("\nPlease ensure your drought CSV has these columns:")
    print("  - CULTRF_LAND, CULTIR_LAND, elevation, slope1, WAT_LAND")
    print("\nSteps:")
    print("  1. Download from: https://www.kaggle.com/datasets/cdminix/us-drought-meteorological-data")
    print("  2. Place CSV in: flask_api/datasets/")
    print("  3. Run this script again")
    exit(1)

print(f"\n✅ Using: {drought_file}")
print(f"   Samples: {len(df)}")
print(f"   Columns: {df.columns.tolist()}")

# ==================== CREATE MOISTURE SENSORS ====================
print("\n2. Creating 5 moisture sensors...")

# Check which columns are available
available_features = []
desired_features = ['CULTRF_LAND', 'CULTIR_LAND', 'WAT_LAND', 'elevation', 'slope1']

for feat in desired_features:
    if feat in df.columns:
        available_features.append(feat)
    else:
        print(f"   ⚠️  Missing {feat}, will use alternative")

if len(available_features) < 3:
    print("❌ Not enough features. Need at least 3 of: CULTRF_LAND, CULTIR_LAND, WAT_LAND, elevation, slope1")
    exit(1)

print(f"   Using features: {available_features}")

# Scale features
scaler = StandardScaler()
feature_data = df[available_features].fillna(0)
scaled = scaler.fit_transform(feature_data)

# Create sensors
np.random.seed(42)

# Sensor formulas adapt based on available features
if 'CULTRF_LAND' in available_features:
    idx_cultrf = available_features.index('CULTRF_LAND')
    sensor1 = 50 - (scaled[:, idx_cultrf] * 10)
else:
    sensor1 = np.random.uniform(30, 60, len(df))

if 'CULTIR_LAND' in available_features:
    idx_cultir = available_features.index('CULTIR_LAND')
    sensor2 = 50 + (scaled[:, idx_cultir] * 8)
else:
    sensor2 = np.random.uniform(35, 65, len(df))

if 'elevation' in available_features:
    idx_elev = available_features.index('elevation')
    sensor3 = 50 - (scaled[:, idx_elev] * 5)
else:
    sensor3 = np.random.uniform(40, 70, len(df))

sensor4 = 55 - scaled[:, 0] * 6 + scaled[:, min(1, len(available_features)-1)] * 6
sensor5 = 55 - scaled[:, 0] * 4

# Clip to valid ranges
sensor1 = np.clip(sensor1, 10, 90)
sensor2 = np.clip(sensor2, 10, 90)
sensor3 = np.clip(sensor3, 10, 90)
sensor4 = np.clip(sensor4, 15, 85)
sensor5 = np.clip(sensor5, 15, 85)

# Add noise
sensor1 = np.clip(sensor1 + np.random.normal(0, 2, len(sensor1)), 10, 90)
sensor2 = np.clip(sensor2 + np.random.normal(0, 2, len(sensor2)), 10, 90)
sensor3 = np.clip(sensor3 + np.random.normal(0, 2, len(sensor3)), 10, 90)
sensor4 = np.clip(sensor4 + np.random.normal(0, 2, len(sensor4)), 15, 85)
sensor5 = np.clip(sensor5 + np.random.normal(0, 2, len(sensor5)), 15, 85)

# Create DataFrame
irrigation_df = pd.DataFrame({
    'moisture0': sensor1,
    'moisture1': sensor2,
    'moisture2': sensor3,
    'moisture3': sensor4,
    'moisture4': sensor5
})

irrigation_df['avg_moisture'] = irrigation_df[['moisture0', 'moisture1', 'moisture2', 'moisture3', 'moisture4']].mean(axis=1)

# ==================== CREATE TARGET ====================
print("\n3. Creating irrigation targets...")

base_need = (irrigation_df['avg_moisture'] < 45).astype(float)

# Adjust based on available features
if 'CULTRF_LAND' in df.columns:
    dryland_factor = (df['CULTRF_LAND'] / 100) * 0.3
else:
    dryland_factor = 0

if 'CULTIR_LAND' in df.columns:
    irrigated_factor = (df['CULTIR_LAND'] / 100) * -0.2
else:
    irrigated_factor = 0

irrigation_prob = base_need + dryland_factor + irrigated_factor
irrigation_prob = np.clip(irrigation_prob, 0, 1)
irrigation_df['irrigation_needed'] = (irrigation_prob > 0.5).astype(int)

# ==================== STATISTICS ====================
print(f"\n4. Statistics:")
print(f"   Total samples: {len(irrigation_df)}")
print(f"   Avg moisture: {irrigation_df['avg_moisture'].mean():.1f}%")
print(f"   Needs irrigation: {irrigation_df['irrigation_needed'].sum()} ({irrigation_df['irrigation_needed'].sum()/len(irrigation_df)*100:.1f}%)")

# ==================== SAVE ====================
print("\n5. Saving...")
irrigation_df.to_csv('datasets/irrigation_data.csv', index=False)
print(f"✅ Saved to: datasets/irrigation_data.csv")

print("\nSample data:")
print(irrigation_df.head(10))

print("\n" + "="*70)
print("✅ SUCCESS! Next: python train_irrigation_real.py")
print("="*70)