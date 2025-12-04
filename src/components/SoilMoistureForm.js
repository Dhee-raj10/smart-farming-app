// frontend/src/components/SoilMoistureForm.js
import React, { useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';

const SoilMoistureForm = () => {
  const [formData, setFormData] = useState({
    moisture0: '', moisture1: '', moisture2: '', moisture3: '', moisture4: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const value = e.target.value;
    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:5000/api/crops/moisture', formData);
      setResult(response.data);
    } catch (err) {
      console.error("Error:", err);
      setResult({ error: err.response?.data?.error || 'Prediction failed' });
    } finally {
      setLoading(false);
    }
  };

  const getMoistureColor = (value) => {
    if (value < 30) return '#dc3545';
    if (value < 45) return '#fd7e14';
    if (value < 60) return '#ffc107';
    return '#28a745';
  };

  const getMoistureLevel = (value) => {
    if (value < 30) return 'Critical';
    if (value < 45) return 'Low';
    if (value < 60) return 'Adequate';
    return 'Optimal';
  };

  const sensorFields = [
    { name: 'moisture0', label: 'Sensor 1 (Surface)', icon: 'bi-droplet', depth: '0-10cm' },
    { name: 'moisture1', label: 'Sensor 2 (Shallow)', icon: 'bi-droplet-half', depth: '10-20cm' },
    { name: 'moisture2', label: 'Sensor 3 (Medium)', icon: 'bi-droplet-fill', depth: '20-30cm' },
    { name: 'moisture3', label: 'Sensor 4 (Deep)', icon: 'bi-water', depth: '30-40cm' },
    { name: 'moisture4', label: 'Sensor 5 (Root Zone)', icon: 'bi-tsunami', depth: '40-50cm' },
  ];

  return (
    <>
      <Navbar />
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="card shadow-lg rounded-3 border-0">
                <div className="card-body p-4 p-md-5">
                  
                  {/* Header */}
                  <div className="text-center mb-5">
                    <div className="mb-3">
                      <i className="bi bi-moisture display-4 text-primary"></i>
                    </div>
                    <h2 className="fw-bold text-primary mb-3">
                      Soil Moisture Analysis & Irrigation Prediction
                    </h2>
                    <p className="text-muted">
                      Enter moisture readings from 5 soil sensors to get AI-powered irrigation recommendations
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit}>
                    <div className="row g-4">
                      {sensorFields.map((field) => (
                        <div className="col-md-6" key={field.name}>
                          <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                              <div className="d-flex align-items-center mb-3">
                                <div 
                                  className="rounded-circle p-3 me-3"
                                  style={{ 
                                    backgroundColor: formData[field.name] 
                                      ? getMoistureColor(parseFloat(formData[field.name])) + '20'
                                      : '#e9ecef'
                                  }}
                                >
                                  <i 
                                    className={`${field.icon} fs-4`}
                                    style={{ 
                                      color: formData[field.name]
                                        ? getMoistureColor(parseFloat(formData[field.name]))
                                        : '#6c757d'
                                    }}
                                  ></i>
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-0">{field.label}</h6>
                                  <small className="text-muted">Depth: {field.depth}</small>
                                </div>
                              </div>

                              <div className="form-floating">
                                <input
                                  type="number"
                                  className="form-control form-control-lg"
                                  id={field.name}
                                  name={field.name}
                                  placeholder="0-100"
                                  value={formData[field.name]}
                                  onChange={handleChange}
                                  required
                                  min="0"
                                  max="100"
                                  step="0.1"
                                />
                                <label htmlFor={field.name}>Moisture Level (%)</label>
                              </div>

                              {formData[field.name] && (
                                <div className="mt-3">
                                  <div className="d-flex justify-content-between mb-1">
                                    <small className="text-muted">Level:</small>
                                    <small className="fw-bold" style={{ color: getMoistureColor(parseFloat(formData[field.name])) }}>
                                      {getMoistureLevel(parseFloat(formData[field.name]))}
                                    </small>
                                  </div>
                                  <div className="progress" style={{ height: '8px' }}>
                                    <div 
                                      className="progress-bar"
                                      style={{ 
                                        width: `${formData[field.name]}%`,
                                        backgroundColor: getMoistureColor(parseFloat(formData[field.name]))
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
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
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-lightning-charge-fill me-2"></i>
                            Predict Irrigation Need
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Results */}
                  {result && !result.error && result.success && (
                    <div className="mt-5">
                      <div 
                        className="card border-0 shadow-lg mb-4"
                        style={{ 
                          background: `linear-gradient(135deg, ${result.recommendation?.color}15 0%, ${result.recommendation?.color}05 100%)`,
                          borderLeft: `5px solid ${result.recommendation?.color}`
                        }}
                      >
                        <div className="card-body p-4">
                          <div className="text-center mb-4">
                            <h3 className="fw-bold mb-3" style={{ color: result.recommendation?.color }}>
                              {result.irrigationNeeded ? '🚰 IRRIGATION NEEDED' : '✅ NO IRRIGATION NEEDED'}
                            </h3>
                            
                            <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                              <span 
                                className="badge px-4 py-2 fs-6"
                                style={{ backgroundColor: result.recommendation?.color }}
                              >
                                {result.recommendation?.urgency} Priority
                              </span>
                              <span className="badge bg-secondary px-4 py-2 fs-6">
                                {result.confidence_percentage} Confidence
                              </span>
                            </div>

                            <div className="progress mb-3" style={{ height: '30px' }}>
                              <div 
                                className="progress-bar"
                                style={{ 
                                  width: `${result.confidence * 100}%`,
                                  backgroundColor: result.recommendation?.color
                                }}
                              >
                                <strong>{result.confidence_percentage}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="alert" style={{ backgroundColor: result.recommendation?.color + '20', border: 'none' }}>
                            <h5 className="mb-3">
                              <i className="bi bi-megaphone-fill me-2"></i>
                              {result.recommendation?.action}
                            </h5>
                            <hr />
                            <div className="row g-3">
                              <div className="col-md-6">
                                <strong><i className="bi bi-droplet-fill me-2"></i>Amount:</strong>
                                <p className="mb-0">{result.recommendation?.amount}</p>
                              </div>
                              <div className="col-md-6">
                                <strong><i className="bi bi-gear-fill me-2"></i>Method:</strong>
                                <p className="mb-0">{result.recommendation?.method}</p>
                              </div>
                              <div className="col-md-6">
                                <strong><i className="bi bi-clock-fill me-2"></i>Timeline:</strong>
                                <p className="mb-0">{result.recommendation?.timeline}</p>
                              </div>
                              <div className="col-md-6">
                                <strong><i className="bi bi-calendar-check me-2"></i>Next Check:</strong>
                                <p className="mb-0">{result.recommendation?.next_check}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sensor Analysis */}
                      <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                          <h5 className="fw-bold mb-4">
                            <i className="bi bi-bar-chart-line-fill me-2"></i>
                            Moisture Analysis
                          </h5>

                          <div className="mb-4 p-3 bg-light rounded">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-1">Average Soil Moisture</h6>
                                <small className="text-muted">Across all sensors</small>
                              </div>
                              <div className="text-end">
                                <h3 
                                  className="mb-0 fw-bold"
                                  style={{ color: getMoistureColor(result.average_moisture) }}
                                >
                                  {result.average_moisture?.toFixed(1)}%
                                </h3>
                                <small style={{ color: getMoistureColor(result.average_moisture) }}>
                                  {getMoistureLevel(result.average_moisture)}
                                </small>
                              </div>
                            </div>
                          </div>

                          <h6 className="mb-3">Individual Sensors:</h6>
                          <div className="row g-3">
                            {result.sensor_readings && Object.entries(result.sensor_readings).map(([sensor, value], index) => (
                              <div key={sensor} className="col-6 col-md-4">
                                <div 
                                  className="p-3 rounded text-center"
                                  style={{ 
                                    backgroundColor: getMoistureColor(value) + '15',
                                    border: `2px solid ${getMoistureColor(value)}`
                                  }}
                                >
                                  <i className={`${sensorFields[index]?.icon} fs-4 mb-2`} style={{ color: getMoistureColor(value) }}></i>
                                  <div className="fw-bold" style={{ color: getMoistureColor(value) }}>
                                    {value?.toFixed(1)}%
                                  </div>
                                  <small className="text-muted">{sensor.replace('sensor', 'Sensor ')}</small>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-3 justify-content-center">
                        <button 
                          className="btn btn-outline-primary btn-lg rounded-pill px-5"
                          onClick={() => window.print()}
                        >
                          <i className="bi bi-download me-2"></i>
                          Download Report
                        </button>
                        <button 
                          className="btn btn-outline-secondary btn-lg rounded-pill px-5"
                          onClick={() => {
                            setFormData({ moisture0: '', moisture1: '', moisture2: '', moisture3: '', moisture4: '' });
                            setResult(null);
                          }}
                        >
                          <i className="bi bi-arrow-clockwise me-2"></i>
                          New Reading
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {result && result.error && (
                    <div className="alert alert-danger mt-5">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                </div>
              </div>

              {/* Guidelines */}
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-lightbulb-fill text-warning me-2"></i>
                    Moisture Guidelines
                  </h6>
                  <div className="row">
                    <div className="col-md-3 text-center mb-3">
                      <div className="p-3 rounded" style={{ backgroundColor: '#dc354520' }}>
                        <div className="fw-bold text-danger">0-30%</div>
                        <small>Critical</small>
                      </div>
                    </div>
                    <div className="col-md-3 text-center mb-3">
                      <div className="p-3 rounded" style={{ backgroundColor: '#fd7e1420' }}>
                        <div className="fw-bold" style={{ color: '#fd7e14' }}>30-45%</div>
                        <small>Low</small>
                      </div>
                    </div>
                    <div className="col-md-3 text-center mb-3">
                      <div className="p-3 rounded" style={{ backgroundColor: '#ffc10720' }}>
                        <div className="fw-bold text-warning">45-60%</div>
                        <small>Adequate</small>
                      </div>
                    </div>
                    <div className="col-md-3 text-center mb-3">
                      <div className="p-3 rounded" style={{ backgroundColor: '#28a74520' }}>
                        <div className="fw-bold text-success">60-100%</div>
                        <small>Optimal</small>
                      </div>
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

export default SoilMoistureForm;