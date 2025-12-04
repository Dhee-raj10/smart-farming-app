// src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/authUtils.js';
import Navbar from '../components/Navbar';
import WeatherSection from '../components/WeatherSection';
import Footer from '../components/Footer';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const currentUser = await authUtils.getCurrentUser(token);
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <Navbar />

      {/* Dashboard Header */}
      <section style={{ background: '#000000', color: 'white', padding: '2rem 0', marginBottom: '2rem' }}>
        <div className="container">
          <h1 className="display-5 fw-bold mb-2">
            {user.farmName ? `${user.farmName} Dashboard` : 'Farm Dashboard'}
          </h1>
          <p className="lead mb-0">
            Welcome back, {user.email}
          </p>
        </div>
      </section>

      {/* Dashboard Content */}
      <div className="container my-5">
        <div className="fade-in">
          {/* Weather Section */}
          <WeatherSection />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;