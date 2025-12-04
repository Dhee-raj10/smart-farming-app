"""
Diagnostic script to check soil dataset quality and issues
"""
import os
from PIL import Image
import numpy as np

DATASET_PATH = 'datasets/soil_images'

print("="*70)
print("SOIL DATASET DIAGNOSTIC")
print("="*70)

# Check 1: Dataset structure
print("\n1. Checking dataset structure...")
if not os.path.exists(DATASET_PATH):
    print(f"❌ Dataset not found at {DATASET_PATH}")
    exit(1)

soil_types = [d for d in os.listdir(DATASET_PATH) 
              if os.path.isdir(os.path.join(DATASET_PATH, d))]
print(f"✅ Found {len(soil_types)} soil types")

# Check 2: Image counts
print("\n2. Image distribution:")
total = 0
min_count = float('inf')
max_count = 0
for soil_type in sorted(soil_types):
    folder = os.path.join(DATASET_PATH, soil_type)
    images = [f for f in os.listdir(folder) 
              if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))]
    count = len(images)
    total += count
    min_count = min(min_count, count)
    max_count = max(max_count, count)
    
    # Mark imbalanced classes
    if count < 100:
        marker = "⚠️  LOW"
    elif count > 300:
        marker = "⚠️  HIGH"
    else:
        marker = "✅"
    
    print(f"   {marker} {soil_type}: {count} images")

print(f"\n   Total: {total} images")
print(f"   Min: {min_count}, Max: {max_count}")
print(f"   Imbalance ratio: {max_count/min_count:.2f}x")

if max_count/min_count > 4:
    print("\n   ⚠️  WARNING: Severe class imbalance detected!")
    print("   Recommendation: Add more images to underrepresented classes")

# Check 3: Sample images
print("\n3. Checking sample images...")
issues = []
for soil_type in soil_types[:3]:  # Check first 3 classes
    folder = os.path.join(DATASET_PATH, soil_type)
    images = [f for f in os.listdir(folder) 
              if f.lower().endswith(('.png', '.jpg', '.jpeg'))][:5]
    
    for img_name in images:
        try:
            img_path = os.path.join(folder, img_name)
            img = Image.open(img_path)
            
            # Check if corrupted
            img.verify()
            
            # Reopen to get properties
            img = Image.open(img_path)
            width, height = img.size
            mode = img.mode
            
            # Check issues
            if width < 100 or height < 100:
                issues.append(f"{soil_type}/{img_name}: Too small ({width}x{height})")
            if mode not in ['RGB', 'L']:
                issues.append(f"{soil_type}/{img_name}: Unusual mode ({mode})")
                
        except Exception as e:
            issues.append(f"{soil_type}/{img_name}: Corrupted - {e}")

if issues:
    print(f"   ⚠️  Found {len(issues)} issues:")
    for issue in issues[:10]:  # Show first 10
        print(f"      {issue}")
else:
    print("   ✅ All sampled images look good")

# Check 4: Recommendations
print("\n" + "="*70)
print("RECOMMENDATIONS")
print("="*70)

if total < 500:
    print("⚠️  Dataset is small (<500 images)")
    print("   • Use aggressive data augmentation")
    print("   • Use transfer learning (MobileNetV2/ResNet)")
    print("   • Consider collecting more images")

if max_count/min_count > 3:
    print("\n⚠️  Class imbalance detected")
    print("   • Add class_weight='balanced' to model")
    print("   • Collect more images for underrepresented classes")
    print("   • Use oversampling/undersampling")

print("\n✅ Proceed with improved training script:")
print("   python train_soil_image_model.py")
print("\nThis script uses:")
print("   • Transfer Learning (MobileNetV2)")
print("   • Aggressive data augmentation")
print("   • Two-phase training (freeze then fine-tune)")
print("   • Should achieve 60-80% accuracy")
print("="*70)