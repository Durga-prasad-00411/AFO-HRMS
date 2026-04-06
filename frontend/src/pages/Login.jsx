import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectBasedOnRole = (rawRole) => {
    const role = normalizeRole(rawRole);

    switch (role) {
      case "SUPER_ADMIN":
        return "/superadmin";
      case "ADMIN":
        return "/admin";
      case "HR":
        return "/hr";
      case "MANAGER":
        return "/manager";
      case "TL":
      case "TEAM_LEAD":
      case "TEAMLEADER":
        return "/teamlead";
      case "EMPLOYEE":
      default:
        return "/dashboard";
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and Password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email: email.trim(),
        password: password.trim(),
      });

      const { token, role, user_id, first_name, last_name } = res.data;

      if (!token || !role) {
        setError("Invalid credentials");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", normalizeRole(role));
      localStorage.setItem("user_id", String(user_id || ""));
      // Store full name for Welcome greeting
      const fullName = [first_name, last_name].filter(Boolean).join(" ").trim();
      localStorage.setItem("userName", fullName || email.split("@")[0]);

      navigate(redirectBasedOnRole(role));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <h2>Login</h2>

        {error && <p className="error-text">{error}</p>}

        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="input-group">
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
