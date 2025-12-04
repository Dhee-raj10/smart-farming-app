import os
import requests
import gdown
from pathlib import Path

def download_from_drive(file_id, output_path):
    """Download file from Google Drive"""
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    gdown.download(url, output_path, quiet=False)

def download_models():
    """Download all required models on startup"""
    
    # Create directories
    os.makedirs('models', exist_ok=True)
    os.makedirs('datasets', exist_ok=True)
    
    # Google Drive file IDs (replace with your actual IDs)
    files_to_download = {
        'models/fertility_model.pkl': '1ZUSElOGr3ESDv6wDR-slj5RXPu9oI2jJ',
        'models/fertility_scaler.pkl': '1s7HIiQ4WGPAnk3zNVQJbyCjrqN73pa8B',
        'models/fertility_features.pkl': '1U02YNgVYRE0cDbMKeYDvFKfAoHaOHiwI',
        'models/irrigation_model.pkl': '1Hofom6e-5emW2kZ79Ic-xCeTPTOZtXvi',
        'models/irrigation_scaler.pkl': '1ndLm3GaO3SkQJzd0K5Uba0-wx5H-Zr8E',
        'models/irrigation_features.pkl': '1jSfkdCE-XTl1zTD7E-V_3h5fqdkUrUq8',
        'models/soil_image_model.keras': '1lNZzFVwl-Zj7PBzjdAkqAaQ30bcs-egf',
        'models/soil_class_labels.json': '18SwY7Lnv0ASHdShazgcsVxVIQ_xf4MOq',
        'models/soil_model_metadata.json': '1zE-frtzFmyjF1bBEQfC5oUN2w_eWHI1k',
        'models/soil_image_best.h5':'1b8oHL2gIVLdXy1jRZKRksTBUqZTClqyG',
        'models/soil_image_model.h5':'192mNoD-EvLNzz8g1UmVhTNoxyj131Rx4',
        'models/soil_image_best.keras':'1auEP9QJ0VOGsKDqh07gkyR1Z4_GE5VjN'
    }
    
    print("📥 Downloading models from cloud storage...")
    
    for output_path, file_id in files_to_download.items():
        if not os.path.exists(output_path):
            print(f"  Downloading {output_path}...")
            try:
                download_from_drive(file_id, output_path)
                print(f"  ✅ {output_path}")
            except Exception as e:
                print(f"  ❌ Failed to download {output_path}: {e}")
        else:
            print(f"  ⏭️  {output_path} already exists")
    
    print("✅ All models downloaded!")

if __name__ == '__main__':
    download_models()