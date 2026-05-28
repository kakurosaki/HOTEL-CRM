import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import NewBookingModal from "../components/NewBookingModal";
import CancelBookingModal from "../components/CancelBookingModal";
import "../../css/bookings.css";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [editingStatus, setEditingStatus] = useState("confirmed");
  const [cancelBooking, setCancelBooking] = useState(null);
  const [viewBooking, setViewBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [search, statusFilter, bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await fetch("/api/bookings");
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

    setFilteredBookings(filtered);
  };

  const handleAddBooking = () => {
    fetchBookings();
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const startStatusEdit = (booking) => {
    setEditingBookingId(booking.id);
    setEditingStatus((booking.status || "pending").toLowerCase());
    setActionError("");
  };

  const updateBookingStatus = async (bookingId, status, options = {}) => {
    try {
      setActionLoadingId(bookingId);
      setActionError("");

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update booking");
      }

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: data.status || status }
            : booking
        )
      );

      if (options.closeEdit) {
        setEditingBookingId(null);
      }
      if (options.closeCancel) {
        setCancelBooking(null);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      setActionError(error.message || "Failed to update booking");
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

      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete booking");
      }

      setBookings((prev) => prev.filter((item) => item.id !== booking.id));
      if (cancelBooking?.id === booking.id) {
        setCancelBooking(null);
      }
      if (editingBookingId === booking.id) {
        setEditingBookingId(null);
      }
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
                         {formatStatus(booking.status)}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                       {editingBookingId === booking.id ? (
                         <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                           <select
                             value={editingStatus}
                             onChange={(e) => setEditingStatus(e.target.value)}
                             disabled={actionLoadingId === booking.id}
                             style={{ padding: "0.35rem 2rem 0.35rem 0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                           >
                             <option value="confirmed">Confirmed</option>
                             <option value="pending">Pending</option>
                             <option value="cancelled">Cancelled</option>
                           </select>
                           <button
                             onClick={() => updateBookingStatus(booking.id, editingStatus, { closeEdit: true })}
                             disabled={actionLoadingId === booking.id}
                             style={{ border: "none", backgroundColor: "#16a34a", color: "white", borderRadius: "4px", padding: "0.35rem 0.6rem", cursor: "pointer" }}
                           >
                             {actionLoadingId === booking.id ? "Saving..." : "Save"}
                           </button>
                           <button
                             onClick={() => setEditingBookingId(null)}
                             disabled={actionLoadingId === booking.id}
                             style={{ border: "1px solid #cbd5e1", backgroundColor: "white", color: "#334155", borderRadius: "4px", padding: "0.35rem 0.6rem", cursor: "pointer" }}
                           >
                             Cancel
                           </button>
                         </div>
                       ) : (
                         <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                           <button
                             onClick={() => startStatusEdit(booking)}
                             disabled={actionLoadingId === booking.id}
                             style={{ border: "1px solid #cbd5e1", backgroundColor: "white", color: "#334155", borderRadius: "4px", padding: "0.35rem 0.6rem", cursor: "pointer" }}
                           >
                             Edit
                           </button>
                           <button
                             onClick={() => setViewBooking(booking)}
                             disabled={actionLoadingId === booking.id}
                             style={{ border: "1px solid #cbd5e1", backgroundColor: "white", color: "#334155", borderRadius: "4px", padding: "0.35rem 0.6rem", cursor: "pointer" }}
                           >
                             View
                           </button>
                           <button
                             onClick={() => {
                               setActionError("");
                               setCancelBooking(booking);
                             }}
                             disabled={actionLoadingId === booking.id || booking.status?.toLowerCase() === "cancelled"}
                             style={{ border: "none", backgroundColor: "#dc2626", color: "white", borderRadius: "4px", padding: "0.35rem 0.6rem", cursor: "pointer", opacity: booking.status?.toLowerCase() === "cancelled" ? 0.6 : 1 }}
                           >
                             Cancel
                           </button>
                           <button
                             onClick={() => handleDeleteBooking(booking)}
                             disabled={actionLoadingId === booking.id}
                             style={{ border: "none", backgroundColor: "#334155", color: "white", borderRadius: "4px", padding: "0.35rem 0.6rem", cursor: "pointer" }}
                           >
                             {actionLoadingId === booking.id ? "Working..." : "Delete"}
                           </button>
                         </div>
                       )}
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
      <CancelBookingModal
        isOpen={Boolean(cancelBooking)}
        booking={cancelBooking}
        loading={actionLoadingId === cancelBooking?.id}
        error={actionError}
        onClose={() => {
          if (actionLoadingId === cancelBooking?.id) return;
          setCancelBooking(null);
          setActionError("");
        }}
        onConfirm={(booking) =>
          updateBookingStatus(booking.id, "cancelled", { closeCancel: true })
        }
      />
      {viewBooking && (
        <div className="modalOverlay" onClick={() => setViewBooking(null)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Booking #{viewBooking.id}</h2>
            </div>
            <div style={{ display: "grid", gap: "0.5rem", color: "#334155" }}>
              <div><strong>Guest:</strong> {viewBooking.guest_name}</div>
              <div><strong>Room:</strong> {viewBooking.room_number}</div>
              <div><strong>Check-in:</strong> {viewBooking.check_in_date} {viewBooking.check_in_time}</div>
              <div><strong>Check-out:</strong> {viewBooking.check_out_date} {viewBooking.check_out_time}</div>
              <div><strong>Total:</strong> ${viewBooking.total_price || "N/A"}</div>
              <div><strong>Status:</strong> {formatStatus(viewBooking.status)}</div>
            </div>
            <div className="modalFooter">
              <button type="button" className="btnCancel" onClick={() => setViewBooking(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
