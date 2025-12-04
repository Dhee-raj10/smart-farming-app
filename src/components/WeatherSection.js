import React, { useEffect, useState } from "react";

const WeatherSection = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_KEY = "05811d81dfd64ee0999175445253008"; // your WeatherAPI key

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // WeatherAPI: Current + Forecast in one request
            const res = await fetch(
              `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=5&aqi=no&alerts=no`
            );
            const data = await res.json();

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
          } catch (err) {
            console.error("Error fetching weather:", err);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLoading(false);
        }
      );
    } else {
      console.error("Geolocation not supported by this browser.");
      setLoading(false);
    }
  }, []);

  if (loading) return <p>Loading weather...</p>;
  if (!weatherData) return <p>Unable to fetch weather.</p>;

  return (
    <section className="mb-5">
      <h2 className="h4 fw-bold mb-4">
        Weather Conditions - {weatherData.location}
      </h2>

      <div className="row g-4">
        {/* Current Weather */}
        <div className="col-lg-4">
          <div className="weather-card card h-100 border-0">
            <div className="card-body text-center">
              <img src={weatherData.current.icon} alt="weather" className="mb-3" />
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
                      <img src={day.icon} alt="forecast" className="mb-2" />
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
