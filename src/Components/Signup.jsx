import React, { useState } from "react";
import { signupUser } from "../Service/AuthService";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // Handle Input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Signup
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await signupUser(formData);

      toast.success(res.data.message);

      setFormData({
        name: "",
        email: "",
        password: "",
      });

      navigate("/");

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Signup Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card animate-fade-in">
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
          Create Account
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "14px",
            marginBottom: "32px",
          }}
        >
          Join us and start blogging & chatting today
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              className="premium-input"
            />
          </div>

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

          <button
            type="submit"
            className="premium-btn"
            disabled={loading}
            style={{ marginTop: "10px" }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "14px",
            color: "var(--text-muted)",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/"
            style={{
              color: "var(--primary)",
              fontWeight: "600",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseOver={(e) => e.target.style.color = "var(--primary-hover)"}
            onMouseOut={(e) => e.target.style.color = "var(--primary)"}
          >
            Login
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

export default Signup;