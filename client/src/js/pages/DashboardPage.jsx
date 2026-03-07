import React from "react";

export default function DashboardPage({ staff }) {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Hotel CRM Dashboard</h1>

      <div className="card" style={{ padding: "2rem" }}>
        <h2>Welcome, {staff.name}!</h2>
        <p>Email: {staff.email}</p>
        <p>Role: {staff.role}</p>
      </div>
    </div>
  );
}