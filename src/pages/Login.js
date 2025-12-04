import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authUtils } from "../utils/authUtils";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await authUtils.login(formData.email, formData.password);

      // ✅ Save token
      localStorage.setItem("token", data.token);

      navigate("/dashboard"); // redirect after successful login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="text-center mb-4">
              <i className="bi bi-person-badge display-1 text-primary"></i>
              <h1 className="h3 text-primary fw-bold">Smart Farming</h1>
              <p className="text-muted">Smart farming insights for better decisions</p>
            </div>
            <div className="card border-0 shadow">
              <div className="card-body p-4">
                <h2 className="card-title text-center mb-4">Login</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="form-control mb-3"
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="form-control mb-4"
                    required
                  />
                  <button className="btn btn-farm w-100" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>
                <div className="text-center mt-3">
                  <button
                    className="btn btn-link"
                    onClick={() => navigate("/signup")}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
