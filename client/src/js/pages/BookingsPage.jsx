import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import NewBookingModal from "../components/NewBookingModal";
import BookingEditModal from "../components/BookingEditModal";
import "../../css/bookings.css";
import { apiFetch } from "../utils/api";

export default function BookingsPage({ staff }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetchBookings();
    fetchGuests();
    fetchRooms();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [search, statusFilter, dateFrom, dateTo, bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await apiFetch("/api/bookings");
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setPageError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await apiFetch("/api/guests");
      const data = await response.json();
      setGuests(Array.isArray(data) ? data : data.guests || []);
    } catch (error) {
      console.error("Error fetching guests:", error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await apiFetch("/api/rooms");
      const data = await response.json();
      setRooms(Array.isArray(data) ? data : data.rooms || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (search.trim() !== "") {
      filtered = filtered.filter(
        (booking) =>
          booking.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
          booking.room_number?.includes(search) ||
          booking.id.toString().includes(search)
      );
    }

    if (statusFilter !== "All Status") {
      filtered = filtered.filter(
        (booking) => booking.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (dateFrom) {
      filtered = filtered.filter((booking) => booking.check_in_date >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter((booking) => booking.check_in_date <= dateTo);
    }

    setFilteredBookings(filtered);
  };

  const handleAddBooking = () => {
    fetchBookings();
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const saveBooking = async (bookingId, payload) => {
    try {
      setActionLoadingId(bookingId);
      setActionError("");

      const response = await apiFetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update booking");
      }

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? { ...booking, ...data }
            : booking
        )
      );

      setSelectedBooking((prev) => (prev && prev.id === bookingId ? { ...prev, ...data } : prev));
      return data;
    } catch (error) {
      console.error("Error updating booking:", error);
      setActionError(error.message || "Failed to update booking");
      return null;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteBooking = async (booking) => {
    const confirmed = window.confirm(`Delete booking #${booking.id}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setActionLoadingId(booking.id);
      setActionError("");

      const response = await apiFetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete booking");
      }

      setBookings((prev) => prev.filter((item) => item.id !== booking.id));
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error deleting booking:", error);
      setActionError(error.message || "Failed to delete booking");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
        return "#16a34a";
      case "pending":
        return "#eab308";
      case "checked-in":
        return "#2563eb";
      case "checked-out":
        return "#64748b";
      case "no-show":
        return "#7c3aed";
      case "cancelled":
        return "#dc2626";
      default:
        return "#475569";
    }
  };

  return (
    <div className="crmPage">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Bookings</h1>
          <p className="pageLead">Manage reservations, stays, and guest occupancy from one source of truth.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="crmActionButton"
          style={{ padding: "0.8rem 1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Plus size={20} /> New Booking
        </button>
      </div>

      <div className="toolbar">
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
              padding: "0.9rem 1rem 0.9rem 2.65rem",
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
          <option>Checked-in</option>
          <option>Checked-out</option>
          <option>No-show</option>
          <option>Cancelled</option>
        </select>
      </div>

      <div className="toolbar" style={{ marginBottom: "1.5rem" }}>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{ padding: "0.9rem 1rem" }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{ padding: "0.9rem 1rem" }}
        />
      </div>

      {loading ? (
        <div className="surfaceCard panel">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="surfaceCard panel emptyState">No bookings found.</div>
      ) : (
        <div className="surfaceCard panel" style={{ overflowX: "auto" }}>
          <table className="dataTable">
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
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>ACTIONS</th>
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
                    <td style={{ padding: "1rem" }}>
                      <div>{booking.check_in_date}</div>
                      <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{booking.check_in_time}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div>{booking.check_out_date}</div>
                      <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{booking.check_out_time}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>{nights}</td>
                    <td style={{ padding: "1rem" }}>${booking.total_price || "N/A"}</td>
                    <td style={{ padding: "1rem" }}>
                      <span className="statusPill" style={{ backgroundColor: getStatusColor(booking.status) }}>
                        {formatStatus(booking.status)}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        disabled={actionLoadingId === booking.id}
                        className="btnCancel"
                        style={{ padding: "0.45rem 0.85rem" }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pageError && (
        <p style={{ color: "#dc2626", marginTop: "1rem" }}>
          ❌ {pageError}
        </p>
      )}
      {actionError && (
        <p style={{ color: "#dc2626", marginTop: "1rem" }}>
          ❌ {actionError}
        </p>
      )}

      <NewBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddBooking}
      />

      <BookingEditModal
        isOpen={Boolean(selectedBooking)}
        booking={selectedBooking}
        guests={guests}
        rooms={rooms}
        loadingId={actionLoadingId}
        onClose={() => setSelectedBooking(null)}
        onSave={saveBooking}
        onDelete={handleDeleteBooking}
        canDelete={staff?.role === "Admin"}
      />
    </div>
  );
}
