import os
import requests
import gdown
from pathlib import Path

def download_from_drive(file_id, output_path):
    """Download file from Google Drive with better error handling"""
    try:
        print(f"  Downloading to {output_path}...")
        url = f"https://drive.google.com/uc?export=download&id={file_id}"
        gdown.download(url, output_path, quiet=False)
        
        # Verify file was downloaded
        file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
        
        # JSON files can be small, only check > 50 bytes
        min_size = 50 if output_path.endswith('.json') else 1000
        
        if file_size > min_size:
            print(f"  ✅ Downloaded successfully ({file_size} bytes)")
            return True
        else:
            print(f"  ❌ Download failed or file too small ({file_size} bytes)")
            return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def download_models():
    """Download all required models on startup"""
    
    # Create directories
    os.makedirs('models', exist_ok=True)
    os.makedirs('datasets', exist_ok=True)
    
    print("="*70)
    print("DOWNLOADING ML MODELS")
    print("="*70)
    
    # Google Drive file IDs - VERIFY THESE ARE CORRECT
    files_to_download = {
        # Fertility models
        'models/fertility_model.pkl': '1ZUSElOGr3ESDv6wDR-slj5RXPu9oI2jJ',
        'models/fertility_scaler.pkl': '1s7HIiQ4WGPAnk3zNVQJbyCjrqN73pa8B',
        'models/fertility_features.pkl': '1U02YNgVYRE0cDbMKeYDvFKfAoHaOHiwI',
        
        # Irrigation models
        'models/irrigation_model.pkl': '1noEeY2qoPj8q9rnebOzkyXgWO44euIMO',
        'models/irrigation_scaler.pkl': '156iZGLd-Pz6YhNWbv1bSluuUBT2jk0G3',
        'models/irrigation_features.pkl': '1zaHQ4pfxT8xd4VxlIRnsiRrY3e-c1U3T',
        
        # Soil image models - TRY ALL FORMATS
        'models/soil_image_model.keras': '1lNZzFVwl-Zj7PBzjdAkqAaQ30bcs-egf',
        'models/soil_image_best.keras': '1auEP9QJ0VOGsKDqh07gkyR1Z4_GE5VjN',
        'models/soil_image_model.h5': '192mNoD-EvLNzz8g1UmVhTNoxyj131Rx4',
        'models/soil_image_best.h5': '1b8oHL2gIVLdXy1jRZKRksTBUqZTClqyG',
        
        # Soil metadata
        'models/soil_class_labels.json': '18SwY7Lnv0ASHdShazgcsVxVIQ_xf4MOq',
        'models/soil_model_metadata.json': '1zE-frtzFmyjF1bBEQfC5oUN2w_eWHI1k',
    }
    
    downloaded_count = 0
    failed_count = 0
    skipped_count = 0
    
    for output_path, file_id in files_to_download.items():
        print(f"\n📥 {output_path}")
        
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            # Different minimum sizes for different file types
            min_size = 50 if output_path.endswith('.json') else 1000
            
            if file_size > min_size:
                print(f"  ⏭️  Already exists ({file_size} bytes)")
                skipped_count += 1
                continue
            else:
                print(f"  ⚠️  File exists but too small, re-downloading...")
                os.remove(output_path)
        
        if download_from_drive(file_id, output_path):
            downloaded_count += 1
        else:
            failed_count += 1
    
    print("\n" + "="*70)
    print("DOWNLOAD SUMMARY")
    print("="*70)
    print(f"✅ Downloaded: {downloaded_count}")
    print(f"⏭️  Skipped: {skipped_count}")
    print(f"❌ Failed: {failed_count}")
    
    # Check critical models
    print("\n" + "="*70)
    print("VERIFYING CRITICAL MODELS")
    print("="*70)
    
    critical_checks = {
        'Fertility Model': 'models/fertility_model.pkl',
        'Fertility Scaler': 'models/fertility_scaler.pkl',
        'Fertility Features': 'models/fertility_features.pkl',
        'Soil Class Labels': 'models/soil_class_labels.json',
        'Soil Metadata': 'models/soil_model_metadata.json'
    }
    
    all_critical_exist = True
    for name, path in critical_checks.items():
        if os.path.exists(path) and os.path.getsize(path) > 100:
            print(f"✅ {name}: OK ({os.path.getsize(path)} bytes)")
        else:
            print(f"❌ {name}: MISSING or INVALID")
            all_critical_exist = False
    
    # Check for at least ONE soil image model
    print("\n📸 Soil Image Model:")
    soil_models = [
        'models/soil_image_model.keras',
        'models/soil_image_best.keras',
        'models/soil_image_model.h5',
        'models/soil_image_best.h5'
    ]
    
    soil_model_found = False
    for model_path in soil_models:
        if os.path.exists(model_path) and os.path.getsize(model_path) > 1000000:  # > 1MB
            print(f"  ✅ Found: {model_path} ({os.path.getsize(model_path)} bytes)")
            soil_model_found = True
        elif os.path.exists(model_path):
            print(f"  ⚠️  {model_path} exists but seems too small ({os.path.getsize(model_path)} bytes)")
    
    if not soil_model_found:
        print("  ❌ NO VALID SOIL IMAGE MODEL FOUND!")
        print("\n  MANUAL FIX:")
        print("  1. Upload your trained model to Google Drive")
        print("  2. Make it publicly accessible (Anyone with link can view)")
        print("  3. Get the file ID from the share link")
        print("  4. Update file IDs in download_models.py")
        print("  5. Run: python download_models.py")
        all_critical_exist = False
    
    print("\n" + "="*70)
    if all_critical_exist and soil_model_found:
        print("✅ ALL MODELS READY!")
    else:
        print("❌ SOME MODELS MISSING - CHECK ABOVE")
    print("="*70)

if __name__ == '__main__':
    download_models()