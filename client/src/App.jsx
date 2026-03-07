import React, { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./js/components/login";
import DashboardLayout from "./js/components/dashboardLayout";

import DashboardPage from "./js/pages/DashboardPage";
import GuestsPage from "./js/pages/GuestsPage";
import BookingsPage from "./js/pages/BookingsPage";
import RoomsPage from "./js/pages/RoomsPage";
import RegisterPage from "./js/pages/RegisterPage";

export default function App() {
  const [staff, setStaff] = useState(null);

  const handleLoginSuccess = (staffData) => {
    setStaff(staffData);
  };

  const handleLogout = () => {
    setStaff(null);
  };
  
  if (!staff) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  
  return (
    <Routes>
      <Route
        path="/"
        element={<DashboardLayout staff={staff} onLogout={handleLogout} />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage staff={staff} />} />
        <Route path="guests" element={<GuestsPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}