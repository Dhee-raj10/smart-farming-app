"""
Improved Soil Image Classification Model Training
With better architecture and data handling
"""
import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
import json

print("="*70)
print("TRAINING SOIL IMAGE CLASSIFICATION MODEL (IMPROVED)")
print("="*70)

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 16  # Reduced for stability
EPOCHS = 50
DATASET_PATH = 'datasets/soil_images'

# Check dataset
if not os.path.exists(DATASET_PATH):
    print(f"❌ Dataset folder '{DATASET_PATH}' not found!")
    exit(1)

# Get soil types
print("\n1. Loading dataset structure...")
soil_types = [d for d in os.listdir(DATASET_PATH) 
              if os.path.isdir(os.path.join(DATASET_PATH, d))]
soil_types = sorted(soil_types)
print(f"✅ Found {len(soil_types)} soil types: {soil_types}")

# Count images
print("\n2. Counting images...")
total_images = 0
for soil_type in soil_types:
    count = len([f for f in os.listdir(os.path.join(DATASET_PATH, soil_type)) 
                 if f.lower().endswith(('.png', '.jpg', '.jpeg'))])
    print(f"   {soil_type}: {count} images")
    total_images += count

print(f"\n   Total images: {total_images}")

# Data augmentation
print("\n3. Setting up data augmentation...")
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=30,
    width_shift_range=0.3,
    height_shift_range=0.3,
    horizontal_flip=True,
    vertical_flip=True,
    zoom_range=0.3,
    shear_range=0.2,
    brightness_range=[0.8, 1.2],
    fill_mode='nearest',
    validation_split=0.2
)

# Load data
train_generator = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

validation_generator = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

print(f"✅ Training samples: {train_generator.samples}")
print(f"✅ Validation samples: {validation_generator.samples}")

# Build model using Transfer Learning (MobileNetV2)
print("\n4. Building model with Transfer Learning (MobileNetV2)...")

# Load pre-trained MobileNetV2
base_model = MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)

# Freeze base model initially
base_model.trainable = False

# Build model
model = keras.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.BatchNormalization(),
    layers.Dropout(0.5),
    layers.Dense(256, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    layers.Dense(len(soil_types), activation='softmax')
])

# Compile
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print(model.summary())

# Callbacks
callbacks = [
    keras.callbacks.EarlyStopping(
        monitor='val_accuracy',
        patience=10,
        restore_best_weights=True,
        verbose=1
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=5,
        min_lr=1e-7,
        verbose=1
    ),
    keras.callbacks.ModelCheckpoint(
        'models/soil_image_best.keras',
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    )
]

# Phase 1: Train with frozen base
print("\n5. Training Phase 1 (Frozen base model)...")
history1 = model.fit(
    train_generator,
    validation_data=validation_generator,
    epochs=20,
    callbacks=callbacks,
    verbose=1
)

# Phase 2: Fine-tuning
print("\n6. Training Phase 2 (Fine-tuning)...")
base_model.trainable = True

# Freeze early layers, fine-tune later layers
for layer in base_model.layers[:100]:
    layer.trainable = False

# Recompile with lower learning rate
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.0001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history2 = model.fit(
    train_generator,
    validation_data=validation_generator,
    epochs=30,
    callbacks=callbacks,
    verbose=1
)

# Evaluate
print("\n7. Evaluating model...")
train_loss, train_acc = model.evaluate(train_generator, verbose=0)
val_loss, val_acc = model.evaluate(validation_generator, verbose=0)

print(f"\n{'='*70}")
print("FINAL MODEL PERFORMANCE")
print("="*70)
print(f"Training Accuracy: {train_acc*100:.2f}%")
print(f"Validation Accuracy: {val_acc*100:.2f}%")

# Save model
print("\n8. Saving model...")
os.makedirs('models', exist_ok=True)

# Save in Keras format (.keras)
model.save('models/soil_image_model.keras')
print("✅ Saved: models/soil_image_model.keras")

# Also save as H5 for compatibility
model.save('models/soil_image_model.h5')
print("✅ Saved: models/soil_image_model.h5")

# Save class labels
class_indices = train_generator.class_indices
class_labels = {v: k for k, v in class_indices.items()}

with open('models/soil_class_labels.json', 'w') as f:
    json.dump(class_labels, f, indent=2)
print("✅ Saved: models/soil_class_labels.json")

# Save metadata
metadata = {
    'img_size': IMG_SIZE,
    'num_classes': len(soil_types),
    'class_names': soil_types,
    'class_indices': class_indices,
    'train_accuracy': float(train_acc),
    'val_accuracy': float(val_acc),
    'model_architecture': 'MobileNetV2 + Custom Head',
    'total_images': total_images,
    'training_samples': train_generator.samples,
    'validation_samples': validation_generator.samples
}

with open('models/soil_model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print("✅ Saved: models/soil_model_metadata.json")

# Test prediction
print("\n9. Testing prediction...")
test_image_path = None
for soil_type in soil_types[:1]:
    folder = os.path.join(DATASET_PATH, soil_type)
    images = [f for f in os.listdir(folder) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    if images:
        test_image_path = os.path.join(folder, images[0])
        break

if test_image_path:
    from tensorflow.keras.preprocessing import image
    
    img = image.load_img(test_image_path, target_size=(IMG_SIZE, IMG_SIZE))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0
    
    predictions = model.predict(img_array, verbose=0)
    predicted_class = np.argmax(predictions[0])
    confidence = predictions[0][predicted_class]
    
    print(f"\nTest image: {test_image_path}")
    print(f"Actual: {os.path.basename(os.path.dirname(test_image_path))}")
    print(f"Predicted: {class_labels[predicted_class]}")
    print(f"Confidence: {confidence*100:.2f}%")
    
    print("\nTop 3 predictions:")
    top_3_idx = np.argsort(predictions[0])[-3:][::-1]
    for idx in top_3_idx:
        print(f"  {class_labels[idx]}: {predictions[0][idx]*100:.2f}%")

print(f"\n{'='*70}")
print("✅ SOIL IMAGE CLASSIFICATION MODEL READY!")
print("="*70)
print("\nFiles created:")
print("  - models/soil_image_model.keras (recommended)")
print("  - models/soil_image_model.h5 (for compatibility)")
print("  - models/soil_class_labels.json")
print("  - models/soil_model_metadata.json")
print("\nModel Architecture: MobileNetV2 with Transfer Learning")
print(f"Expected Accuracy: ~{val_acc*100:.0f}% (should be >70%)")
print("\nNext: Update Flask API and test!")
print("="*70)