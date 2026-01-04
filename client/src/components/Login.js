import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const Login = ({ onLogin }) => {
  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/login",
        {
          username,
          password,
          role,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        onLogin(res.data.user);
        navigate(role === "admin" ? "/admin" : "/student");
      }
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
      <div className="login-box">
        <div className="login-header">
          <h1>🏠 Hostel Management System</h1>
          <p>Distributed Systems Capstone</p>
        </div>

        <div className="role-selector">
          <button
            className={`role-btn ${role === "student" ? "active" : ""}`}
            onClick={() => setRole("student")}
          >
            🧑‍🎓 Student Login
          </button>
          <button
            className={`role-btn ${role === "admin" ? "active" : ""}`}
            onClick={() => setRole("admin")}
          >
            🧑‍💼 Admin Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                role === "student" ? "student1 or student2" : "admin"
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={role === "student" ? "student123" : "admin123"}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-info">
          <p>
            <strong>Demo Credentials:</strong>
          </p>
          <p>Student: student1 / student123</p>
          <p>Admin: admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
