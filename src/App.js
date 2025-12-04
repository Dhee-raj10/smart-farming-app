import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';

// Import forms
import SoilFertilityForm from './components/SoilFertilityForm';
import SoilMoistureForm from './components/SoilMoistureForm';
import SoilImageClassification from './components/SoilImageClassification';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/fertility-analysis" element={<SoilFertilityForm />} />
          <Route path="/irrigation-prediction" element={<SoilMoistureForm />} />
          <Route path="/soil-classification" element={<SoilImageClassification />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;