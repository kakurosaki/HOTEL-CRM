import React from "react";
import "../../css/login.css"; // import the CSS

function Login() {
  return (
    <div className="login-container ">
      <h3>Hotel CRM</h3>
      <p>Sign in to manage your hotel</p>
      <div className="card login-card">
        

        <form>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter username"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Sign In
          </button>
        </form>

        <div className="mt-3">
          <small className="text-muted">Demo Credentials:</small>
          <p className="mb-0">Admin: admin / admin123</p>
          <p className="mb-0">Staff: staff / staff123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
