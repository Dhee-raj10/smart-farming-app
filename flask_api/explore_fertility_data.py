import pandas as pd
import numpy as np

# Load the dataset
df = pd.read_csv('datasets/soil_data.csv')

print("="*70)
print("SOIL FERTILITY DATASET EXPLORATION")
print("="*70)

# Basic info
print(f"\n📊 Dataset Shape: {df.shape}")
print(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}")

print("\n📋 Column Names:")
print(df.columns.tolist())

print("\n🔍 First 5 Rows:")
print(df.head())

print("\n📈 Data Types:")
print(df.dtypes)

print("\n📉 Statistical Summary:")
print(df.describe())

print("\n❓ Missing Values:")
print(df.isnull().sum())

# Check target column
print("\n🎯 Looking for Target Column...")
for col in df.columns:
    if 'fertility' in col.lower() or 'output' in col.lower() or 'class' in col.lower():
        print(f"\n✅ Found target column: '{col}'")
        print(f"Unique values: {df[col].unique()}")
        print(f"Value counts:")
        print(df[col].value_counts())

print("\n" + "="*70)