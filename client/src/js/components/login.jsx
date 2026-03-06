import React, { useState } from "react";
import { User, Lock } from "lucide-react";
import "../../css/login.css";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Login successful - call parent callback
      onLoginSuccess(data.staff);
    } catch (err) {
      setError("Failed to connect to server");
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <header className="loginHeader">
        <h1 className="h1">Hotel CRM</h1>
        <p className="loginSubtitle">Sign in to manage your hotel</p>
      </header>

      <main className="loginCard card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: "red", marginBottom: "1rem", textAlign: "center" }}>
              {error}
            </div>
          )}

          <div className="field">
            <label className="label">Username</label>
            <div className="inputWithIcon">
              <User className="inputIcon" size={22} />
              <input
                type="text"
                className="textInput"
                placeholder="Enter username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Password</label>
            <div className="inputWithIcon">
              <Lock className="inputIcon" size={22} />
              <input
                type="password"
                className="textInput"
                placeholder="Enter password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btnPrimary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Login;