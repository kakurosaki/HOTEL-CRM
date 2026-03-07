import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../css/sidebar.css";

export default function DashboardLayout({ staff, onLogout }) {
  return (
    <div className="crmLayout">
      <aside className="crmSidebar">
        <div className="crmSidebarTop">
          <div className="crmBrand">Hotel CRM</div>

          <nav className="crmNav">
            <NavLink to="/dashboard" className={({ isActive }) => "crmNavItem" + (isActive ? " active" : "")}>
              Dashboard
            </NavLink>
            <NavLink to="/guests" className={({ isActive }) => "crmNavItem" + (isActive ? " active" : "")}>
              Guests
            </NavLink>
            <NavLink to="/bookings" className={({ isActive }) => "crmNavItem" + (isActive ? " active" : "")}>
              Bookings
            </NavLink>
            <NavLink to="/rooms" className={({ isActive }) => "crmNavItem" + (isActive ? " active" : "")}>
              Rooms
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => "crmNavItem" + (isActive ? " active" : "")}>
              Register
            </NavLink>
          </nav>
        </div>

        <div className="crmSidebarBottom">
          <button type="button" onClick={onLogout} className="crmLogout">
            Logout
          </button>
        </div>
      </aside>

      <main className="crmMain">
        <Outlet />
      </main>
    </div>
  );
}