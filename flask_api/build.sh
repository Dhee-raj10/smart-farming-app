#!/bin/bash

echo "🔧 Installing dependencies..."
pip install -r requirements.txt

echo "📥 Downloading models..."
python download_models.py

echo "✅ Build complete!"