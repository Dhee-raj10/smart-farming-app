// src/components/Navbar.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/authUtils';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const currentUser = authUtils.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    authUtils.logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <button 
          className="navbar-brand btn btn-link text-decoration-none p-0"
          onClick={() => navigate('/')}
        >
          <i className="bi bi-clipboard-data text-primary me-2"></i>
          <span className="fw-bold text-primary">Smart Farming</span>
        </button>

        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {user ? (
              <>
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link"
                    onClick={() => navigate('/dashboard')}
                  >
                    Dashboard
                  </button>
                </li>
                
                {/* Dropdown for Analysis Tools */}
                <li className="nav-item dropdown">
                  <button 
                    className="nav-link dropdown-toggle btn btn-link" 
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-tools me-1"></i>
                    Analysis Tools
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate('/soil-classification')}
                      >
                        <i className="bi bi-image me-2"></i>
                        Soil Image Classification
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate('/fertility-analysis')}
                      >
                        <i className="bi bi-clipboard-data me-2"></i>
                        Fertility Analysis
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate('/irrigation-prediction')}
                      >
                        <i className="bi bi-droplet me-2"></i>
                        Irrigation Prediction
                      </button>
                    </li>
                  </ul>
                </li>

                <li className="nav-item dropdown">
                  <button 
                    className="nav-link dropdown-toggle btn btn-link" 
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-person-circle me-1"></i>
                    {user.email}
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className="btn btn-farm btn-sm ms-2"
                    onClick={() => navigate('/signup')}
                  >
                    Sign Up
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;