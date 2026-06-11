import React, { useState } from "react";
import { loginUser } from "../Service/AuthService";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Login = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);


  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= HANDLE LOGIN =================
  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      const res = await loginUser(formData);

      toast.success(res.data.message);

      // SAVE TOKEN
      localStorage.setItem(
        "token",
        res.data.token
      );

      // SAVE USER
      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      // REDIRECT TO CHAT
      navigate("/blogs");

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        "Login Failed"
      );

    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* LOGIN CARD */}
      <div className="glass-card animate-fade-in">
        {/* TITLE */}
        <h1
          style={{
            textAlign: "center",
            marginBottom: "12px",
            color: "var(--text-main)",
            fontWeight: "800",
            fontSize: "32px",
            letterSpacing: "-1px",
          }}
        >
          Welcome Back
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "14px",
            marginBottom: "32px",
          }}
        >
          Sign in to your account to continue
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* EMAIL */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="premium-input"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="premium-input"
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            className="premium-btn"
            disabled={loading}
            style={{ marginTop: "10px" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* SIGNUP LINK */}
        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "14px",
            color: "var(--text-muted)",
          }}
        >
          Don't have an account?{" "}
          <Link
            to="/signup"
            style={{
              color: "var(--primary)",
              fontWeight: "600",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseOver={(e) => e.target.style.color = "var(--primary-hover)"}
            onMouseOut={(e) => e.target.style.color = "var(--primary)"}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "var(--text-muted)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

export default Login; 