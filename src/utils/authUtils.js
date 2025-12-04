const API_URL = "http://localhost:5000/api/auth"; // Backend URL

export const authUtils = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let errMsg = "Login failed";
      try {
        const err = await res.json();
        errMsg = err.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    return await res.json(); // { _id, email, farmName, token }
  },

  signup: async (userData) => {
    const res = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      let errMsg = "Signup failed";
      try {
        const err = await res.json();
        errMsg = err.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    return await res.json(); // { _id, email, farmName, token }
  },

  getCurrentUser: async (token) => {
    const res = await fetch(`${API_URL}/profile`, {   // ✅ fixed endpoint
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!res.ok) return null;

    return await res.json(); // backend returns req.user
  },
  logout: () => {
    localStorage.removeItem("token"); // clear JWT
    sessionStorage.removeItem("token"); // just in case
  }
};

export default authUtils;
