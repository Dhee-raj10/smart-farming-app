import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CropRecommendations = ({ soil, rainfall, temperature }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recommendations from backend
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.post("http://localhost:5000/api/crops/recommend", {
          soil,
          rainfall,
          temperature
        });
        setRecommendations(response.data);
      } catch (error) {
        console.error("Error fetching crop recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [soil, rainfall, temperature]);

  const getSuitabilityClass = (suitability) => {
    switch (suitability?.toLowerCase()) {
      case 'excellent': return 'suitability-excellent';
      case 'good': return 'suitability-good';
      case 'fair': return 'suitability-fair';
      case 'poor': return 'suitability-poor';
      default: return '';
    }
  };

  const getSuitabilityIcon = (suitability) => {
    switch (suitability?.toLowerCase()) {
      case 'excellent': return 'bi-star-fill text-success';
      case 'good': return 'bi-star-half text-warning';
      case 'fair': return 'bi-star text-warning';
      case 'poor': return 'bi-star text-danger';
      default: return 'bi-star';
    }
  };

  if (loading) return <p>Loading recommendations...</p>;

  return (
    <section className="mb-5">
      <h2 className="h4 fw-bold mb-4">Crop Recommendations</h2>
      
      <div className="row g-4">
        {recommendations.length > 0 ? (
          recommendations.map((crop, index) => (
            <div key={index} className="col-lg-6">
              <div className={`crop-recommendation ${getSuitabilityClass(crop.suitability)}`}>
                <div className="d-flex align-items-center mb-3">
                  <i className={`${getSuitabilityIcon(crop.suitability)} fs-4 me-3`}></i>
                  <div>
                    <h5 className="mb-1 fw-bold">{crop.name}</h5>
                    <span className="badge bg-primary">{crop.suitability || "Unknown"}</span>
                  </div>
                </div>
                
                <p className="text-muted mb-3">{crop.description || "No description available"}</p>
                
                <div className="row g-2 small">
                  <div className="col-6">
                    <strong>Growing Season:</strong><br />
                    <span className="text-muted">{crop.growingSeason || "N/A"}</span>
                  </div>
                  <div className="col-6">
                    <strong>Water Needs:</strong><br />
                    <span className="text-muted">{crop.waterRequirements || "N/A"}</span>
                  </div>
                  <div className="col-6">
                    <strong>Soil Preference:</strong><br />
                    <span className="text-muted">{crop.soilPreference || crop.soil}</span>
                  </div>
                  <div className="col-6">
                    <strong>Est. Yield:</strong><br />
                    <span className="text-muted">{crop.estimatedYield || "N/A"}</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <button className="btn btn-sm btn-outline-primary me-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Learn More
                  </button>
                  <button className="btn btn-sm btn-outline-success">
                    <i className="bi bi-plus-circle me-1"></i>
                    Add to Plan
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No recommendations found for your input.</p>
        )}
      </div>
      
      <div className="text-center mt-4">
        <button className="btn btn-farm">
          <i className="bi bi-download me-2"></i>
          Download Full Report
        </button>
      </div>
    </section>
  );
};

export default CropRecommendations;
