// frontend/src/components/SoilImageClassification.js
// ✅ FIXED: Better error handling, image compression, and detailed logging

import React, { useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://smart-farming-app-1.onrender.com';

const SoilImageClassification = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ✅ COMPRESS IMAGE BEFORE UPLOAD
  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log(`✅ Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = reject;
      };
      
      reader.onerror = reject;
    });
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log(`📷 Original file: ${file.name}, Size: ${(file.size / 1024).toFixed(2)}KB`);
      
      // Check file size
      if (file.size > 16 * 1024 * 1024) {
        alert('File is too large! Please select an image under 16MB.');
        return;
      }
      
      try {
        // Compress image if it's large
        let processedFile = file;
        if (file.size > 500 * 1024) { // If > 500KB, compress
          console.log('🗜️ Compressing image...');
          processedFile = await compressImage(file, 800, 800, 0.8);
        }
        
        setSelectedFile(processedFile);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(processedFile);
        
        setResult(null);
        setUploadProgress(0);
      } catch (err) {
        console.error('❌ Error processing image:', err);
        alert('Failed to process image. Please try another image.');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setResult(null);
    setUploadProgress(0);

    console.log('\n=== SOIL IMAGE UPLOAD ===');
    console.log('Backend URL:', BACKEND_URL);
    console.log('File:', selectedFile.name, `(${(selectedFile.size / 1024).toFixed(2)}KB)`);
    console.log('File type:', selectedFile.type);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      console.log('📤 Uploading to:', `${BACKEND_URL}/api/crops/soil-image`);

      const response = await axios.post(
        `${BACKEND_URL}/api/crops/soil-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minutes
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
            console.log(`⏳ Upload progress: ${percentCompleted}%`);
          },
        }
      );

      console.log('✅ Response received:', response.status);
      console.log('Response data:', response.data);
      
      setResult(response.data);
      
    } catch (err) {
      console.error('\n❌ ERROR DETAILS:');
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      
      if (err.code === 'ECONNABORTED') {
        console.error('⏱️ Request timed out');
        setResult({ 
          error: 'Request timed out. The server might be processing a large image or starting up. Please try again with a smaller image or wait 30 seconds and retry.' 
        });
      } else if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        
        setResult({ 
          error: err.response.data?.error || err.response.data?.details || 'Server error. Please try again.',
          details: JSON.stringify(err.response.data, null, 2)
        });
      } else if (err.request) {
        console.error('No response received');
        console.error('Request:', err.request);
        
        setResult({ 
          error: 'Cannot connect to server. Please check if the backend is running.',
          suggestion: 'The server might be starting up. Wait 30 seconds and try again.'
        });
      } else {
        console.error('Unknown error:', err);
        setResult({ 
          error: err.message || 'Unknown error occurred' 
        });
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setUploadProgress(0);
  };

  return (
    <>
      <Navbar />
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="card shadow-lg rounded-3 border-0">
                <div className="card-body p-4 p-md-5">
                  
                  {/* Header */}
                  <div className="text-center mb-5">
                    <div className="mb-3">
                      <i className="bi bi-image display-4" style={{ color: '#8B4513' }}></i>
                    </div>
                    <h2 className="fw-bold mb-3" style={{ color: '#8B4513' }}>
                      Soil Image Classification
                    </h2>
                    <p className="text-muted">
                      Upload a clear image of your soil sample for AI-powered soil type identification
                    </p>
                  </div>

                  {/* Upload Section */}
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <h5 className="card-title mb-4">
                            <i className="bi bi-cloud-upload me-2"></i>
                            Upload Soil Image
                          </h5>
                          
                          <div className="mb-4">
                            <input
                              type="file"
                              className="form-control form-control-lg"
                              accept="image/*"
                              onChange={handleFileSelect}
                            />
                            <small className="text-muted">
                              Supported: JPG, PNG (Max 16MB). Images over 500KB will be automatically compressed.
                            </small>
                          </div>

                          {previewUrl && (
                            <div className="mb-4">
                              <img 
                                src={previewUrl} 
                                alt="Soil preview" 
                                className="img-fluid rounded shadow"
                                style={{ maxHeight: '300px', width: '100%', objectFit: 'cover' }}
                              />
                              {selectedFile && (
                                <div className="text-center mt-2">
                                  <small className="text-muted">
                                    Size: {(selectedFile.size / 1024).toFixed(2)}KB
                                  </small>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Progress Bar */}
                          {loading && uploadProgress > 0 && (
                            <div className="mb-4">
                              <div className="d-flex justify-content-between mb-2">
                                <small>Uploading...</small>
                                <small>{uploadProgress}%</small>
                              </div>
                              <div className="progress" style={{ height: '10px' }}>
                                <div 
                                  className="progress-bar progress-bar-striped progress-bar-animated"
                                  style={{ width: `${uploadProgress}%`, backgroundColor: '#8B4513' }}
                                ></div>
                              </div>
                            </div>
                          )}

                          <div className="d-grid gap-2">
                            <button
                              className="btn btn-lg rounded-pill shadow"
                              style={{ 
                                backgroundColor: '#8B4513', 
                                color: 'white',
                                border: 'none'
                              }}
                              onClick={handleAnalyze}
                              disabled={!selectedFile || loading}
                            >
                              {loading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  {uploadProgress > 0 && uploadProgress < 100 
                                    ? `Uploading ${uploadProgress}%...`
                                    : 'Analyzing Image...'}
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-magic me-2"></i>
                                  Identify Soil Type
                                </>
                              )}
                            </button>

                            {(selectedFile || result) && (
                              <button
                                className="btn btn-outline-secondary btn-lg rounded-pill"
                                onClick={handleReset}
                                disabled={loading}
                              >
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Upload New Image
                              </button>
                            )}
                          </div>

                          {/* Guidelines */}
                          <div className="mt-4">
                            <h6 className="fw-bold mb-3">
                              <i className="bi bi-lightbulb text-warning me-2"></i>
                              Tips for Best Results
                            </h6>
                            <ul className="list-unstyled small">
                              <li className="mb-2">
                                <i className="bi bi-check-circle text-success me-2"></i>
                                Use clear, well-lit photos
                              </li>
                              <li className="mb-2">
                                <i className="bi bi-check-circle text-success me-2"></i>
                                Show the soil texture clearly
                              </li>
                              <li className="mb-2">
                                <i className="bi bi-check-circle text-success me-2"></i>
                                Avoid shadows and reflections
                              </li>
                              <li className="mb-2">
                                <i className="bi bi-check-circle text-success me-2"></i>
                                Smaller images (under 1MB) upload faster
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Results Section */}
                    <div className="col-lg-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <h5 className="card-title mb-4">
                            <i className="bi bi-clipboard-data me-2"></i>
                            Analysis Results
                          </h5>

                          {!result ? (
                            <div className="text-center py-5">
                              <i className="bi bi-image display-1 text-muted mb-3"></i>
                              <p className="text-muted">
                                Upload a soil image to see AI analysis results
                              </p>
                            </div>
                          ) : result.error ? (
                            <div className="alert alert-danger">
                              <h6 className="alert-heading">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Error Occurred
                              </h6>
                              <p className="mb-2"><strong>Message:</strong> {result.error}</p>
                              
                              {result.suggestion && (
                                <p className="mb-2"><strong>Suggestion:</strong> {result.suggestion}</p>
                              )}
                              
                              {result.details && (
                                <details className="mt-3">
                                  <summary className="btn btn-sm btn-outline-secondary">
                                    Show Technical Details
                                  </summary>
                                  <pre className="mt-2 p-2 bg-light rounded small" style={{ maxHeight: '200px', overflow: 'auto' }}>
                                    {result.details}
                                  </pre>
                                </details>
                              )}
                              
                              <hr />
                              <h6 className="mb-2">Troubleshooting:</h6>
                              <ul className="small mb-0">
                                <li>Try uploading a smaller image (under 1MB)</li>
                                <li>Wait 30 seconds and try again (server may be starting)</li>
                                <li>Check if image is a valid JPG/PNG file</li>
                                <li>Try a different browser</li>
                              </ul>
                            </div>
                          ) : (
                            <div>
                              {/* Success - Main Prediction */}
                              <div 
                                className="p-4 rounded-3 text-center mb-4"
                                style={{ 
                                  backgroundColor: result.characteristics?.color + '20',
                                  border: `3px solid ${result.characteristics?.color}`
                                }}
                              >
                                <h3 className="fw-bold mb-2">
                                  {result.prediction}
                                </h3>
                                <div className="progress mb-3" style={{ height: '25px' }}>
                                  <div 
                                    className="progress-bar"
                                    style={{ 
                                      width: `${result.confidence * 100}%`,
                                      backgroundColor: result.characteristics?.color
                                    }}
                                  >
                                    <strong>{result.confidence_percentage}</strong>
                                  </div>
                                </div>
                                <p className="mb-0 text-muted">
                                  {result.characteristics?.description}
                                </p>
                              </div>

                              {/* Top Predictions */}
                              <div className="mb-4">
                                <h6 className="fw-bold mb-3">Top Predictions:</h6>
                                <div className="row g-2">
                                  {result.top_predictions?.map((pred, idx) => (
                                    <div key={idx} className="col-12">
                                      <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                                        <span className="fw-semibold">
                                          {idx + 1}. {pred.soil_type}
                                        </span>
                                        <span className="badge bg-secondary">
                                          {pred.confidence_percentage}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Characteristics */}
                              <div className="mb-4">
                                <h6 className="fw-bold mb-3">Soil Characteristics:</h6>
                                <div className="row g-3">
                                  <div className="col-6">
                                    <div className="p-3 bg-light rounded text-center">
                                      <div className="fw-bold">Texture</div>
                                      <small className="text-muted">{result.characteristics?.texture}</small>
                                    </div>
                                  </div>
                                  <div className="col-6">
                                    <div className="p-3 bg-light rounded text-center">
                                      <div className="fw-bold">Fertility</div>
                                      <small className="text-muted">{result.characteristics?.fertility}</small>
                                    </div>
                                  </div>
                                  <div className="col-6">
                                    <div className="p-3 bg-light rounded text-center">
                                      <div className="fw-bold">pH Range</div>
                                      <small className="text-muted">{result.characteristics?.pH_range}</small>
                                    </div>
                                  </div>
                                  <div className="col-6">
                                    <div className="p-3 bg-light rounded text-center">
                                      <div className="fw-bold">Water Retention</div>
                                      <small className="text-muted">{result.characteristics?.water_retention}</small>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Best Crops */}
                              <div className="mb-4">
                                <h6 className="fw-bold mb-3">
                                  <i className="bi bi-flower2 me-2"></i>
                                  Best Crops:
                                </h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {result.characteristics?.best_crops?.map((crop, idx) => (
                                    <span key={idx} className="badge bg-success px-3 py-2">
                                      {crop}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Recommendations */}
                              <div className="alert alert-info">
                                <h6 className="fw-bold mb-3">
                                  <i className="bi bi-lightbulb-fill me-2"></i>
                                  Recommendations:
                                </h6>
                                <ul className="mb-0">
                                  {result.characteristics?.recommendations?.map((rec, idx) => (
                                    <li key={idx} className="mb-2">{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  {result && !result.error && (
                    <div className="text-center mt-4">
                      <button 
                        className="btn btn-outline-primary btn-lg rounded-pill px-5"
                        onClick={() => window.print()}
                      >
                        <i className="bi bi-download me-2"></i>
                        Download Report
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-info-circle-fill text-info me-2"></i>
                    About Soil Classification
                  </h6>
                  <p className="mb-0 small">
                    Our AI model analyzes soil images to identify type, texture, and composition. 
                    For best results, use clear photos taken in natural daylight. Images are automatically 
                    compressed for faster upload while maintaining quality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default SoilImageClassification;