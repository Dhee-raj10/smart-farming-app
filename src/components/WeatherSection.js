// src/components/WeatherSection.js
// ✅ FIXED: Better error handling and fallback options

import React, { useEffect, useState } from "react";

const WeatherSection = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Use environment variable for API key
  const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || "a4ce4c2c8bdb44018ec112023250612 ";

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Check if geolocation is available
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by your browser");
        }

        // Get user's location with timeout
        const position = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Location request timed out"));
          }, 10000); // 10 second timeout

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeout);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeout);
              reject(err);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000 // Cache for 5 minutes
            }
          );
        });

        const { latitude, longitude } = position.coords;
        console.log("Location obtained:", latitude, longitude);

        // Fetch weather data
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=5&aqi=no&alerts=no`;
        console.log("Fetching weather from:", url);

        const res = await fetch(url);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Weather API error:", res.status, errorText);
          throw new Error(`Weather API error: ${res.status}`);
        }

        const data = await res.json();
        console.log("Weather data received:", data);

        setWeatherData({
          location: data.location.name,
          current: {
            temperature: data.current.temp_c,
            humidity: data.current.humidity,
            windSpeed: data.current.wind_kph,
            condition: data.current.condition.text,
            icon: data.current.condition.icon,
          },
          forecast: data.forecast.forecastday.map((day) => ({
            day: new Date(day.date).toLocaleDateString("en-US", {
              weekday: "short",
            }),
            high: Math.round(day.day.maxtemp_c),
            low: Math.round(day.day.mintemp_c),
            condition: day.day.condition.text,
            icon: day.day.condition.icon,
          })),
        });
        setError(null);
      } catch (err) {
        console.error("Error fetching weather:", err);
        setError(err.message);
        
        // Set fallback weather data
        setWeatherData({
          location: "Hyderabad",
          current: {
            temperature: 28,
            humidity: 65,
            windSpeed: 12,
            condition: "Partly Cloudy",
            icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
          },
          forecast: [
            {
              day: "Mon",
              high: 32,
              low: 24,
              condition: "Sunny",
              icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
            },
            {
              day: "Tue",
              high: 31,
              low: 23,
              condition: "Partly Cloudy",
              icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
            },
            {
              day: "Wed",
              high: 30,
              low: 22,
              condition: "Cloudy",
              icon: "//cdn.weatherapi.com/weather/64x64/day/119.png",
            },
            {
              day: "Thu",
              high: 29,
              low: 21,
              condition: "Light Rain",
              icon: "//cdn.weatherapi.com/weather/64x64/day/296.png",
            },
            {
              day: "Fri",
              high: 28,
              low: 20,
              condition: "Rain",
              icon: "//cdn.weatherapi.com/weather/64x64/day/302.png",
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [API_KEY]);

  if (loading) {
    return (
      <section className="mb-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading weather...</span>
          </div>
          <p className="mt-3 text-muted">Fetching weather data...</p>
        </div>
      </section>
    );
  }

  if (!weatherData) {
    return (
      <section className="mb-5">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Unable to fetch weather data. Please try again later.
        </div>
      </section>
    );
  }

  return (
    <section className="mb-5">
      <h2 className="h4 fw-bold mb-4">
        Weather Conditions - {weatherData.location}
      </h2>
      
      {error && (
        <div className="alert alert-info mb-4">
          <i className="bi bi-info-circle me-2"></i>
          Showing default weather data. {error}
        </div>
      )}

      <div className="row g-4">
        {/* Current Weather */}
        <div className="col-lg-4">
          <div className="weather-card card h-100 border-0">
            <div className="card-body text-center">
              <img 
                src={`https:${weatherData.current.icon}`} 
                alt="weather" 
                className="mb-3" 
                onError={(e) => {
                  e.target.src = "//cdn.weatherapi.com/weather/64x64/day/116.png";
                }}
              />
              <h3 className="display-4 fw-bold">
                {weatherData.current.temperature}°C
              </h3>
              <p className="mb-3">{weatherData.current.condition}</p>

              <div className="row text-center">
                <div className="col-4">
                  <i className="bi bi-droplet d-block mb-1"></i>
                  <small>{weatherData.current.humidity}%</small>
                </div>
                <div className="col-4">
                  <i className="bi bi-wind d-block mb-1"></i>
                  <small>{weatherData.current.windSpeed} km/h</small>
                </div>
                <div className="col-4">
                  <i className="bi bi-eye d-block mb-1"></i>
                  <small>10 km</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="col-lg-8">
          <div className="card h-100 border-0 farm-card">
            <div className="card-body">
              <h5 className="card-title mb-4">5-Day Forecast</h5>
              <div className="row g-3">
                {weatherData.forecast.map((day, index) => (
                  <div key={index} className="col">
                    <div className="text-center p-3 bg-light rounded">
                      <div className="fw-semibold mb-2">{day.day}</div>
                      <img 
                        src={`https:${day.icon}`} 
                        alt="forecast" 
                        className="mb-2" 
                        onError={(e) => {
                          e.target.src = "//cdn.weatherapi.com/weather/64x64/day/116.png";
                        }}
                      />
                      <div className="small">
                        <div className="fw-bold">{day.high}°</div>
                        <div className="text-muted">{day.low}°</div>
                      </div>
                      <small>{day.condition}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeatherSection;