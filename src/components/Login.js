// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { loginUser } from "../services/api"; // /login
import "../styles/Login.css";

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!rememberMe) {
      setError("You must agree to keep logged in");
      return;
    }

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginUser({ email, password });

      if (data && data.user) {
        const { user_id, user_name, user_type } = data.user;

        // Store user details and login flag
        localStorage.setItem("user_id", user_id);
        localStorage.setItem("user_name", user_name);
        localStorage.setItem("user_type", user_type);
        localStorage.setItem("isAuthenticated", "true");

        setIsAuthenticated(true);
        navigate("/dashboard");
      } else {
        setError("Login failed: No user data returned");
      }
    } catch (err) {
      setError(err.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Sign in</h2>

        <p className="register-prompt">
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")} className="register-link">
            Sign up
          </span>
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="input-label">Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <span
                className="toggle-password"
                onClick={() => !isLoading && setShowPassword(!showPassword)}
              >
                {showPassword ? <IoEyeOff /> : <IoEye />}
              </span>
            </div>
          </div>

          <div className="form-options">
            <div
              className="remember-me"
              onClick={() => !isLoading && setRememberMe(!rememberMe)}
            >
              {rememberMe ? (
                <MdCheckBox className="checkbox checked" />
              ) : (
                <MdCheckBoxOutlineBlank className="checkbox" />
              )}
              <span>
                Keep me logged in <span className="required-asterisk">*</span>
              </span>
            </div>
            <a href="/forgot-password" className="forgot-password">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login now"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
