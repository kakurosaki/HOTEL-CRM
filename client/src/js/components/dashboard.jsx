import React from "react";

function Dashboard({ staff, onLogout }) {
  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Hotel CRM Dashboard</h1>
        <button onClick={onLogout} className="btnPrimary">
          Logout
        </button>
      </div>
      
      <div className="card" style={{ padding: "2rem" }}>
        <h2>Welcome, {staff.name}!</h2>
        <p>Email: {staff.email}</p>
        <p>Role: {staff.role}</p>
      </div>

      {/* Content */}
    </div>
  );
}

export default Dashboard;
