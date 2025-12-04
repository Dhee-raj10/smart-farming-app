import React, { useState } from 'react';

const SoilAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;

    setLoading(true);
    
    // Simulate soil analysis
    setTimeout(() => {
      setAnalysisResult({
        pH: 6.8,
        nitrogen: 85,
        phosphorus: 72,
        potassium: 68,
        moisture: 45,
        soilType: 'Loamy',
        healthScore: 82
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <section className="mb-5">
      <h2 className="h4 fw-bold mb-4">Soil Analysis</h2>
      
      <div className="row g-4">
        {/* Upload Section */}
        <div className="col-lg-6">
          <div className="farm-card card h-100 border-0">
            <div className="card-body">
              <h5 className="card-title">Upload Soil Image</h5>
              <p className="text-muted mb-4">
                Upload a clear image of your soil sample for AI-powered analysis
              </p>
              
              <div className="mb-3">
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>
              
              {selectedFile && (
                <div className="alert alert-info">
                  <i className="bi bi-file-image me-2"></i>
                  Selected: {selectedFile.name}
                </div>
              )}
              
              <button
                className="btn btn-farm w-100"
                onClick={handleAnalyze}
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner me-2"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    Analyze Soil
                  </>
                )}
              </button>
              
              <div className="mt-4">
                <h6 className="fw-semibold mb-3">Analysis Features:</h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    AI-powered soil composition analysis
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Nutrient level detection
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    pH balance assessment
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Personalized recommendations
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="col-lg-6">
          <div className="farm-card card h-100 border-0">
            <div className="card-body">
              <h5 className="card-title">Analysis Results</h5>
              
              {!analysisResult ? (
                <div className="text-center py-5">
                  <i className="bi bi-upload display-1 text-muted mb-3"></i>
                  <p className="text-muted">Upload a soil image to see analysis results</p>
                </div>
              ) : (
                <div>
                  <div className="d-flex align-items-center mb-4">
                    <div className="me-3">
                      <div className="rounded-circle bg-success bg-opacity-10 p-3">
                        <i className="bi bi-award text-success fs-4"></i>
                      </div>
                    </div>
                    <div>
                      <h6 className="mb-1">Overall Health Score</h6>
                      <span className="h4 text-success fw-bold">{analysisResult.healthScore}%</span>
                    </div>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="bg-light p-3 rounded text-center">
                        <div className="fw-bold text-primary">{analysisResult.pH}</div>
                        <small className="text-muted">pH Level</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="bg-light p-3 rounded text-center">
                        <div className="fw-bold text-primary">{analysisResult.nitrogen}%</div>
                        <small className="text-muted">Nitrogen</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="bg-light p-3 rounded text-center">
                        <div className="fw-bold text-primary">{analysisResult.phosphorus}%</div>
                        <small className="text-muted">Phosphorus</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="bg-light p-3 rounded text-center">
                        <div className="fw-bold text-primary">{analysisResult.potassium}%</div>
                        <small className="text-muted">Potassium</small>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h6 className="fw-semibold mb-2">Soil Type: {analysisResult.soilType}</h6>
                    <p className="text-muted small">
                      Your soil composition indicates {analysisResult.soilType.toLowerCase()} soil, 
                      which is excellent for most crop varieties. The nutrient levels are well-balanced.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SoilAnalysis;