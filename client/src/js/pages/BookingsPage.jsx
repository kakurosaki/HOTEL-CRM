import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import NewBookingModal from "../components/NewBookingModal";
import "../../css/bookings.css";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [search, statusFilter, bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bookings");
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (search.trim() !== "") {
      filtered = filtered.filter(
        (booking) =>
          booking.guest_name.toLowerCase().includes(search.toLowerCase()) ||
          booking.room_number.includes(search) ||
          booking.id.toString().includes(search)
      );
    }

    if (statusFilter !== "All Status") {
      filtered = filtered.filter(
        (booking) => booking.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredBookings(filtered);
  };

  const handleAddBooking = (newBooking) => {
    setBookings([newBooking, ...bookings]);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "#16a34a";
      case "pending":
        return "#eab308";
      case "cancelled":
        return "#dc2626";
      default:
        return "#475569";
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Bookings</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Plus size={20} /> New Booking
        </button>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search
            size={20}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.5rem",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "1rem",
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          <option>All Status</option>
          <option>Confirmed</option>
          <option>Pending</option>
          <option>Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p>Loading bookings...</p>
      ) : filteredBookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>BOOKING ID</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>GUEST</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>ROOM</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>CHECK-IN</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>CHECK-OUT</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>NIGHTS</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>TOTAL</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => {
                const nights = Math.ceil(
                  (new Date(booking.check_out_date) - new Date(booking.check_in_date)) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <tr key={booking.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "1rem" }}>#{booking.id}</td>
                    <td style={{ padding: "1rem" }}>{booking.guest_name}</td>
                    <td style={{ padding: "1rem" }}>{booking.room_number}</td>
                    <td style={{ padding: "1rem" }}>{booking.check_in_date}</td>
                    <td style={{ padding: "1rem" }}>{booking.check_out_date}</td>
                    <td style={{ padding: "1rem" }}>{nights}</td>
                    <td style={{ padding: "1rem" }}>${booking.total_price || "N/A"}</td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "4px",
                          backgroundColor: getStatusColor(booking.status),
                          color: "white",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                        }}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <NewBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddBooking}
      />
    </div>
  );
}
