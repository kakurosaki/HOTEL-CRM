import React, { useState } from "react";
import "../../css/register.css";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const roles = ["Admin", "Staff"];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.error || "Registration failed" });
        setLoading(false);
        return;
      }

      setSuccessMessage("User registered successfully!");
      setFormData({
        username: "",
        email: "",
        phone: "",
        role: "",
        password: "",
        confirmPassword: "",
      });
      setErrors({});
    } catch (err) {
      setErrors({ submit: "Failed to connect to server" });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      username: "",
      email: "",
      phone: "",
      role: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setSuccessMessage("");
  };

  return (
    <div className="registerPageContainer">
      <div className="registerContent">
        <div className="registerHeader">
          <div className="registerIcon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
              <path d="M16 11h6"></path>
            </svg>
          </div>
          <h1>Register New User</h1>
          <p className="registerSubtitle">Add new staff or admin users to the system</p>
        </div>

        <form onSubmit={handleSubmit} className="registerForm">
          {successMessage && (
            <div className="successMessage">
              {successMessage}
            </div>
          )}

          {errors.submit && (
            <div className="errorMessage">
              {errors.submit}
            </div>
          )}

          {/* Username Field */}
          <div className="formGroup">
            <label htmlFor="username" className="formLabel">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              className={`formInput ${errors.username ? "inputError" : ""}`}
            />
            {errors.username && <span className="errorText">{errors.username}</span>}
          </div>

          {/* Email Field */}
          <div className="formGroup">
            <label htmlFor="email" className="formLabel">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              className={`formInput ${errors.email ? "inputError" : ""}`}
            />
            {errors.email && <span className="errorText">{errors.email}</span>}
          </div>

          {/* Phone Number Field */}
          <div className="formGroup">
            <label htmlFor="phone" className="formLabel">Phone Number</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
              className={`formInput ${errors.phone ? "inputError" : ""}`}
            />
            {errors.phone && <span className="errorText">{errors.phone}</span>}
          </div>

          {/* Role Field */}
          <div className="formGroup">
            <label htmlFor="role" className="formLabel">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`formInput formSelect ${errors.role ? "inputError" : ""}`}
            >
              <option value="">Select user role</option>
              {roles.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
            {errors.role && <span className="errorText">{errors.role}</span>}
          </div>

          {/* Password Field */}
          <div className="formGroup">
            <label htmlFor="password" className="formLabel">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              className={`formInput ${errors.password ? "inputError" : ""}`}
            />
            {errors.password && <span className="errorText">{errors.password}</span>}
          </div>

          {/* Confirm Password Field */}
          <div className="formGroup">
            <label htmlFor="confirmPassword" className="formLabel">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`formInput ${errors.confirmPassword ? "inputError" : ""}`}
            />
            {errors.confirmPassword && <span className="errorText">{errors.confirmPassword}</span>}
          </div>

          {/* Submit Buttons */}
          <div className="formActions">
            <button
              type="submit"
              className="btnPrimary"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register User"}
            </button>
            <button
              type="button"
              className="btnSecondary"
              onClick={handleClearForm}
              disabled={loading}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* User Registration Guidelines */}
      <div className="guidelinesSection">
        <h2 className="guidelinesTitle">User Registration Guidelines</h2>
        <ul className="guidelinesList">
          <li>
            <strong>Admin users</strong> have full access to all features including revenue data
          </li>
          <li>
            <strong>Staff users</strong> have operational access with limited permissions
          </li>
          <li>
            <strong>Passwords</strong> must be at least 6 characters long
          </li>
          <li>
            <strong>All fields</strong> are required for successful registration
          </li>
        </ul>
      </div>
    </div>
  );
}
