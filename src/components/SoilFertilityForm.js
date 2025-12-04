// frontend/src/components/SoilFertilityForm.js
import React, { useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';

const SoilFertilityForm = () => {
  const [formData, setFormData] = useState({
    N: '', P: '', K: '', pH: '', EC: '', OC: '',
    S: '', Zn: '', Fe: '', Cu: '', Mn: '', B: ''
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    console.log("Sending data:", formData);

    try {
      const response = await axios.post('http://localhost:5000/api/crops/fertility', formData);
      console.log("Response:", response.data);
      setResult(response.data);
    } catch (err) {
      console.error("Full error:", err);
      console.error("Error response:", err.response?.data);
      setResult({ error: err.response?.data?.error || 'Prediction failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getNutrientBadgeColor = (level) => {
    switch(level) {
      case 'High': return 'bg-success';
      case 'Medium': return 'bg-warning';
      case 'Low': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const nutrientFields = [
    { name: 'N', label: 'Nitrogen (N)', placeholder: 'e.g., 280-560', unit: 'kg/ha' },
    { name: 'P', label: 'Phosphorus (P)', placeholder: 'e.g., 11-45', unit: 'kg/ha' },
    { name: 'K', label: 'Potassium (K)', placeholder: 'e.g., 110-560', unit: 'kg/ha' },
    { name: 'pH', label: 'pH Value', placeholder: 'e.g., 6.0-7.5', unit: '' },
    { name: 'EC', label: 'Electrical Conductivity (EC)', placeholder: 'e.g., 0.5-2.0', unit: 'dS/m' },
    { name: 'OC', label: 'Organic Carbon (OC)', placeholder: 'e.g., 0.5-1.5', unit: '%' },
    { name: 'S', label: 'Sulfur (S)', placeholder: 'e.g., 10-20', unit: 'ppm' },
    { name: 'Zn', label: 'Zinc (Zn)', placeholder: 'e.g., 2-5', unit: 'ppm' },
    { name: 'Fe', label: 'Iron (Fe)', placeholder: 'e.g., 10-20', unit: 'ppm' },
    { name: 'Cu', label: 'Copper (Cu)', placeholder: 'e.g., 2-5', unit: 'ppm' },
    { name: 'Mn', label: 'Manganese (Mn)', placeholder: 'e.g., 5-15', unit: 'ppm' },
    { name: 'B', label: 'Boron (B)', placeholder: 'e.g., 0.5-2.0', unit: 'ppm' },
  ];

  return (
    <>
      <Navbar />
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="card shadow-lg rounded-3 border-0">
                <div className="card-body p-4 p-md-5">
                  {/* Header */}
                  <div className="text-center mb-5">
                    <div className="mb-3">
                      <i className="bi bi-clipboard-data display-4 text-primary"></i>
                    </div>
                    <h2 className="card-title fw-bold text-primary mb-3">
                      Soil Fertility Analysis
                    </h2>
                    <p className="text-muted">
                      Enter your soil nutrient data to get AI-powered fertility prediction and personalized recommendations
                    </p>
                  </div>
                  
                  {/* Form */}
                  <form onSubmit={handleSubmit}>
                    <div className="row g-4">
                      {nutrientFields.map(field => (
                        <div className="col-md-6 col-lg-4" key={field.name}>
                          <div className="form-floating">
                            <input
                              type="number"
                              className="form-control"
                              id={field.name}
                              name={field.name}
                              placeholder={field.placeholder}
                              value={formData[field.name]}
                              onChange={handleChange}
                              required
                              step="any"
                            />
                            <label htmlFor={field.name}>
                              {field.label} {field.unit && `(${field.unit})`}
                            </label>
                          </div>
                          <small className="text-muted">Range: {field.placeholder}</small>
                        </div>
                      ))}
                    </div>
                    
                    <div className="d-grid mt-5">
                      <button 
                        type="submit" 
                        className="btn btn-primary btn-lg rounded-pill shadow"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            <span>Analyzing Soil...</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-magic me-2"></i>
                            Predict Fertility
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Results Section */}
                  {result && !result.error && result.success && (
                    <div className="mt-5">
                      {/* Header with Fertility Level */}
                      <div 
                        className="p-4 rounded-3 text-center mb-4" 
                        style={{ backgroundColor: result.recommendation?.color + '20' || '#e9f5ee' }}
                      >
                        <h4 className="fw-bold mb-3" style={{ color: result.recommendation?.color || '#28a745' }}>
                          <i className="bi bi-award-fill me-2"></i>
                          Fertility Level: {result.prediction}
                        </h4>
                        
                        {/* Confidence Bar */}
                        <div className="progress mb-3" style={{ height: '30px' }}>
                          <div 
                            className="progress-bar"
                            style={{ 
                              width: `${result.confidence * 100}%`,
                              backgroundColor: result.recommendation?.color || '#28a745'
                            }}
                          >
                            <strong>{result.confidence_percentage}</strong>
                          </div>
                        </div>
                        
                        {/* Probability Breakdown */}
                        <div className="row text-center mt-3">
                          <div className="col-4">
                            <small className="text-muted d-block">Low</small>
                            <div className="fw-bold">{(result.probabilities?.Low * 100).toFixed(1)}%</div>
                          </div>
                          <div className="col-4">
                            <small className="text-muted d-block">Medium</small>
                            <div className="fw-bold">{(result.probabilities?.Medium * 100).toFixed(1)}%</div>
                          </div>
                          <div className="col-4">
                            <small className="text-muted d-block">High</small>
                            <div className="fw-bold">{(result.probabilities?.High * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>

                      {/* Recommendation Card */}
                      <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-3">
                            <span 
                              className="badge me-3 px-3 py-2 fs-6" 
                              style={{ backgroundColor: result.recommendation?.color }}
                            >
                              {result.recommendation?.priority} Priority
                            </span>
                            <h5 className="mb-0">{result.recommendation?.message}</h5>
                          </div>
                          
                          <h6 className="fw-bold mt-4 mb-3">
                            <i className="bi bi-list-check me-2"></i>
                            Action Plan:
                          </h6>
                          <ul className="list-group list-group-flush">
                            {result.recommendation?.actions?.map((action, i) => (
                              <li key={i} className="list-group-item border-0 ps-0">
                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                {action}
                              </li>
                            ))}
                          </ul>
                          
                          <div className="alert alert-info mt-4 mb-0">
                            <i className="bi bi-clock-fill me-2"></i>
                            <strong>Timeline:</strong> {result.recommendation?.timeline}
                          </div>
                        </div>
                      </div>

                      {/* NPK Analysis */}
                      <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                          <h6 className="fw-bold mb-4">
                            <i className="bi bi-flask me-2"></i>
                            Nutrient Analysis (NPK)
                          </h6>
                          <div className="row g-3">
                            {result.nutrient_analysis && Object.entries(result.nutrient_analysis).map(([nutrient, data]) => (
                              <div key={nutrient} className="col-md-4">
                                <div className={`p-3 rounded-3 h-100 ${
                                  data.level === 'High' ? 'bg-success bg-opacity-10 border border-success' :
                                  data.level === 'Medium' ? 'bg-warning bg-opacity-10 border border-warning' :
                                  'bg-danger bg-opacity-10 border border-danger'
                                }`}>
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="mb-0 fw-bold">{nutrient}</h6>
                                    <span className={`badge ${getNutrientBadgeColor(data.level)}`}>
                                      {data.level}
                                    </span>
                                  </div>
                                  <div className="mb-2">
                                    <strong>Value:</strong> {data.value?.toFixed(1)}
                                  </div>
                                  <div className="mb-2">
                                    <strong>Status:</strong> 
                                    <span className={data.status === 'Sufficient' ? 'text-success' : 'text-danger'}>
                                      {' '}{data.status}
                                    </span>
                                  </div>
                                  <small className="text-muted">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Optimal: {data.optimal_range}
                                  </small>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Input Values Summary */}
                      <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                          <h6 className="fw-bold mb-3">
                            <i className="bi bi-table me-2"></i>
                            Input Values Summary
                          </h6>
                          <div className="row g-2 small">
                            {result.input_values && Object.entries(result.input_values).map(([key, value]) => (
                              <div key={key} className="col-6 col-md-3 col-lg-2">
                                <div className="bg-light p-2 rounded text-center">
                                  <div className="text-muted fw-semibold">{key}</div>
                                  <div className="fw-bold text-primary">
                                    {typeof value === 'number' ? value.toFixed(2) : value}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Download Report Button */}
                      <div className="text-center">
                        <button 
                          className="btn btn-outline-primary btn-lg rounded-pill px-5"
                          onClick={() => window.print()}
                        >
                          <i className="bi bi-download me-2"></i>
                          Download Report
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {result && result.error && (
                    <div className="alert alert-danger mt-5 d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
                      <div>
                        <strong>Error:</strong> {result.error}
                        <div className="mt-2 small">
                          <strong>Troubleshooting:</strong>
                          <ul className="mb-0 mt-1">
                            <li>Make sure Flask API is running on port 8000</li>
                            <li>Check that all input values are valid numbers</li>
                            <li>Verify backend is proxying requests correctly</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-info-circle-fill text-info me-2"></i>
                    How to Use This Tool
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <p className="small mb-2"><strong>Step 1:</strong> Get a soil test done at your nearest agricultural lab</p>
                      <p className="small mb-2"><strong>Step 2:</strong> Enter all 12 nutrient values from your soil test report</p>
                      <p className="small mb-2"><strong>Step 3:</strong> Click "Predict Fertility" to get AI-powered analysis</p>
                    </div>
                    <div className="col-md-6">
                      <p className="small mb-2"><strong>Step 4:</strong> Review the fertility level and confidence score</p>
                      <p className="small mb-2"><strong>Step 5:</strong> Follow the recommended action plan</p>
                      <p className="small mb-2"><strong>Step 6:</strong> Download the report for your records</p>
                    </div>
                  </div>
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

export default SoilFertilityForm;