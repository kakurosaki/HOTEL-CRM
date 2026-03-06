import React, { useState } from "react";
import Login from "./js/components/login";
import Dashboard from "./js/components/dashboard";
import "./App.css";

export default function App() {
  const [staff, setStaff] = useState(null);

  const handleLoginSuccess = (staffData) => {
    setStaff(staffData);
  };

  const handleLogout = () => {
    setStaff(null);
  };

  return (
    <div className="container">
      {staff ? (
        <Dashboard staff={staff} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}