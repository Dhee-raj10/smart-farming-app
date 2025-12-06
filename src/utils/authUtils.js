// src/utils/authUtils.js
// ✅ FIXED: Use consistent environment variable name

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API_URL = `${BACKEND_URL}/api/auth`;

export const authUtils = {
  login: async (email, password) => {
    try {
      console.log("Attempting login to:", `${API_URL}/login`);
      
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("Login response status:", res.status);

      if (!res.ok) {
        let errMsg = "Login failed";
        try {
          const err = await res.json();
          errMsg = err.message || errMsg;
          console.error("Login error:", err);
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      console.log("Login successful:", data);
      return data; // { _id, email, farmName, token }
    } catch (error) {
      console.error("Login exception:", error);
      throw error;
    }
  },

  signup: async (userData) => {
    try {
      console.log("Attempting signup to:", `${API_URL}/signup`);
      
      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      console.log("Signup response status:", res.status);

      if (!res.ok) {
        let errMsg = "Signup failed";
        try {
          const err = await res.json();
          errMsg = err.message || errMsg;
          console.error("Signup error:", err);
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      console.log("Signup successful:", data);
      return data; // { _id, email, farmName, token }
    } catch (error) {
      console.error("Signup exception:", error);
      throw error;
    }
  },

  getCurrentUser: async (token) => {
    try {
      console.log("Fetching profile from:", `${API_URL}/profile`);
      
      const res = await fetch(`${API_URL}/profile`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      console.log("Profile response status:", res.status);

      if (!res.ok) {
        console.error("Failed to fetch profile");
        return null;
      }

      const data = await res.json();
      console.log("Profile fetched:", data);
      return data;
    } catch (error) {
      console.error("Get profile exception:", error);
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    console.log("User logged out");
  }
};

export default authUtils;