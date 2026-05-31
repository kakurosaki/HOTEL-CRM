import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeGuests: 0,
    totalBookings: 0,
    availableRooms: 0,
    monthlyRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [currentGuests, setCurrentGuests] = useState([]);
  const [summary, setSummary] = useState({
    occupancyRate: 0,
    arrivalsToday: 0,
    departuresToday: 0,
    pendingBookings: 0,
    cleaningRooms: 0,
    maintenanceRooms: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [statsResponse, summaryResponse, bookingsResponse, guestsResponse] = await Promise.all([
          apiFetch("/api/dashboard"),
          apiFetch("/api/dashboard/summary"),
          apiFetch("/api/dashboard/recent-bookings"),
          apiFetch("/api/dashboard/current-guests"),
        ]);

        const [statsData, summaryData, bookingsData, guestsData] = await Promise.all([
          statsResponse.json(),
          summaryResponse.ok ? summaryResponse.json() : Promise.resolve({}),
          bookingsResponse.ok ? bookingsResponse.json() : Promise.resolve([]),
          guestsResponse.ok ? guestsResponse.json() : Promise.resolve([]),
        ]);

        setStats(statsData);
        setSummary({
          occupancyRate: summaryData.occupancyRate || 0,
          arrivalsToday: summaryData.arrivalsToday || 0,
          departuresToday: summaryData.departuresToday || 0,
          pendingBookings: summaryData.pendingBookings || 0,
          cleaningRooms: summaryData.cleaningRooms || 0,
          maintenanceRooms: summaryData.maintenanceRooms || 0,
        });
        setRecentBookings(bookingsData);
        setCurrentGuests(guestsData);
        setRecentActivity(summaryData.recentActivity || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  };

  return (
    <div className="crmPage">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Dashboard</h1>
          <p className="pageLead">A live overview of occupancy, arrivals, and revenue.</p>
        </div>
      </div>

      <div className="statGrid cols-4" style={{ marginBottom: "1.5rem" }}>
        <div className="statCard">
          <div className="statLabel">Active Guests</div>
          <div className="statValue">{stats.activeGuests}</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Total Bookings</div>
          <div className="statValue">{stats.totalBookings}</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Available Rooms</div>
          <div className="statValue">{stats.availableRooms}</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Monthly Revenue</div>
          <div className="statValue">${Number(stats.monthlyRevenue || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="statGrid cols-6" style={{ marginBottom: "1.5rem" }}>
        <div className="statCard">
          <div className="statLabel">Occupancy</div>
          <div className="statValue">{summary.occupancyRate}%</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Arrivals Today</div>
          <div className="statValue">{summary.arrivalsToday}</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Departures Today</div>
          <div className="statValue">{summary.departuresToday}</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Pending Bookings</div>
          <div className="statValue">{summary.pendingBookings}</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Cleaning Rooms</div>
          <div className="statValue">{summary.cleaningRooms}</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Maintenance</div>
          <div className="statValue">{summary.maintenanceRooms}</div>
        </div>
      </div>

      {loading ? (
        <div className="surfaceCard panel">Loading dashboard...</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
            <div className="surfaceCard panel">
              <h3 style={{ marginTop: 0 }}>Recent Bookings</h3>
              <table className="dataTable">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", paddingBottom: "0.5rem", color: "#64748b" }}>Guest Name</th>
                    <th style={{ textAlign: "left", paddingBottom: "0.5rem", color: "#64748b" }}>Room Number</th>
                    <th style={{ textAlign: "left", paddingBottom: "0.5rem", color: "#64748b" }}>Total Price</th>
                    <th style={{ textAlign: "left", paddingBottom: "0.5rem", color: "#64748b" }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td style={{ padding: "0.4rem 0" }}>{booking.guest_name}</td>
                      <td style={{ padding: "0.4rem 0" }}>{booking.room_number}</td>
                      <td style={{ padding: "0.4rem 0" }}>${booking.total_price}</td>
                      <td style={{ padding: "0.4rem 0" }}>{booking.nights} night(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="surfaceCard panel">
              <h3 style={{ marginTop: 0 }}>Current Guests</h3>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {currentGuests.map((guest) => (
                  <div key={guest.id} className="subtleCard" style={{ padding: "0.85rem" }}>
                    <div style={{ fontWeight: "600" }}>{guest.name}</div>
                    <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{guest.email}</div>
                    <div style={{ color: "#334155", fontSize: "0.9rem" }}>Room {guest.room_number}</div>
                    <div style={{ color: "#334155", fontSize: "0.9rem" }}>Check-out: {guest.check_out_date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="surfaceCard panel" style={{ marginTop: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {recentActivity.map((item) => (
                <div key={item.id} className="subtleCard" style={{ padding: "0.85rem" }}>
                  <div style={{ fontWeight: "600" }}>{item.action.toUpperCase()} · {item.entity_type}</div>
                  <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{item.entity_name || item.entity_id} by {item.actor}</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{new Date(item.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}