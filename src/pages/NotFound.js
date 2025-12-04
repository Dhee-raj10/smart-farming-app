import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container text-center">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <i className="bi bi-exclamation-triangle display-1 text-warning mb-4"></i>
            <h1 className="display-4 fw-bold text-primary mb-4">404</h1>
            <h2 className="h4 mb-4">Page Not Found</h2>
            <p className="text-muted mb-4">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <button 
                className="btn btn-farm btn-lg"
                onClick={() => navigate('/')}
              >
                Go Home
              </button>
              <button 
                className="btn btn-outline-primary btn-lg"
                onClick={() => navigate(-1)}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;