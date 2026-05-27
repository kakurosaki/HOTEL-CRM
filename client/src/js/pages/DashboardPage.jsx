import React, { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeGuests: 0,
    totalBookings: 0,
    availableRooms: 0,
    monthlyRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [currentGuests, setCurrentGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [statsResponse, bookingsResponse, guestsResponse] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/dashboard/recent-bookings"),
          fetch("/api/dashboard/current-guests"),
        ]);

        const [statsData, bookingsData, guestsData] = await Promise.all([
          statsResponse.json(),
          bookingsResponse.json(),
          guestsResponse.json(),
        ]);

        setStats(statsData);
        setRecentBookings(bookingsData);
        setCurrentGuests(guestsData);
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
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={cardStyle}>
          <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Active Guests</div>
          <div style={{ fontSize: "1.75rem", fontWeight: "700" }}>{stats.activeGuests}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Total Bookings</div>
          <div style={{ fontSize: "1.75rem", fontWeight: "700" }}>{stats.totalBookings}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Available Rooms</div>
          <div style={{ fontSize: "1.75rem", fontWeight: "700" }}>{stats.availableRooms}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Monthly Revenue</div>
          <div style={{ fontSize: "1.75rem", fontWeight: "700" }}>
            ${Number(stats.monthlyRevenue || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Recent Bookings</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
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

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Current Guests</h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {currentGuests.map((guest) => (
                <div key={guest.id} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.75rem" }}>
                  <div style={{ fontWeight: "600" }}>{guest.name}</div>
                  <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{guest.email}</div>
                  <div style={{ color: "#334155", fontSize: "0.9rem" }}>Room {guest.room_number}</div>
                  <div style={{ color: "#334155", fontSize: "0.9rem" }}>Check-out: {guest.check_out_date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}