import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Import your image file here
import farmHeroImage from "../pages/projectpic.jpg"; // Adjust the path to your image

const Home = () => {
  const navigate = useNavigate();

  // Define the style for the hero section with the background image
  const heroStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${farmHeroImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    color: 'white',
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div>
      <Navbar />

      <section className="hero-section" style={heroStyle}>
        <div className="container text-center">
          <h1 className="display-4 fw-bold mb-4">
            Smart Farming Insights at Your Fingertips
          </h1>
          <p className="lead mb-5">
            Upload soil images, analyze soil health, get weather forecasts and receive AI-powered crop recommendations
          </p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <button className="btn btn-light btn-lg px-4" onClick={() => navigate("/signup")}>
              Get Started
            </button>
            <button className="btn btn-outline-light btn-lg px-4" onClick={() => navigate("/login")}>
              Login
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5 display-5 fw-bold">Smart Farm Management Features</h2>
          <div className="row g-4">
            {[
              { icon: "bi-cloud-upload", title: "Soil Image Analysis", text: "Upload images of your soil for AI-powered analysis of composition and health" },
              { icon: "bi-cloud-rain", title: "Weather Forecasting", text: "Accurate weather predictions to plan your farming activities effectively" },
              { icon: "bi-bar-chart", title: "Soil Health Monitoring", text: "Track soil nutrients, pH levels, moisture and temperature over time" },
              { icon: "bi-cpu", title: "AI-Powered Recommendations", text: "Get advanced crop suggestions and farming insights powered by OpenAI" }
            ].map((feature, idx) => (
              <div className="col-md-6 col-lg-3" key={idx}>
                <div className="farm-card card h-100 border-0">
                  <div className="card-body text-center">
                    <div className="feature-icon"><i className={`bi ${feature.icon}`}></i></div>
                    <h5 className="card-title">{feature.title}</h5>
                    <p className="card-text text-muted">{feature.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5 text-center">
        <div className="container">
          <h2 className="display-5 fw-bold mb-4">See How It Works</h2>
          <p className="lead text-muted mb-5 mx-auto" style={{maxWidth: "600px"}}>
            Join thousands of farmers making data-driven decisions with Smart Farming App
          </p>
          <button className="btn btn-farm btn-lg px-5" onClick={() => navigate("/signup")}>
            Create Free Account
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;