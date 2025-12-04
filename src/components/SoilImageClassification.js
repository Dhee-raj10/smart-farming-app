// frontend/src/components/SoilImageClassification.js
import React, { useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';

const SoilImageClassification = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear previous results
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await axios.post(
        'http://localhost:5000/api/crops/soil-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 seconds
        }
      );

      console.log('Response:', response.data);
      setResult(response.data);
    } catch (err) {
      console.error('Error:', err);
      setResult({ 
        error: err.response?.data?.error || 'Failed to analyze image. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
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
                              Supported formats: JPG, JPEG, PNG (Max 16MB)
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
                                  Analyzing Image...
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
                                Fill the frame with soil
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
                              <i className="bi bi-exclamation-triangle me-2"></i>
                              <strong>Error:</strong> {result.error}
                            </div>
                          ) : (
                            <div>
                              {/* Main Prediction */}
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
                    Our AI model has been trained on comprehensive soil image datasets to identify different 
                    soil types based on color, texture, and composition. This helps you make informed decisions 
                    about crop selection and soil management practices.
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