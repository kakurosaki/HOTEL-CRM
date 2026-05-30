import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import RoomSearchSelect from "./RoomSearchSelect";
import "../../css/modal.css";
import { apiFetch } from "../utils/api";

export default function NewBookingModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    guest_id: "",
    room_id: "",
    check_in_date: "",
    check_in_time: "",
    check_out_date: "",
    check_out_time: "",
    status: "confirmed",
  });
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchGuests();
      fetchRooms();
    }
  }, [isOpen]);

  const fetchGuests = async () => {
    try {
      const response = await apiFetch("/api/guests");
      const data = await response.json();
      setGuests(Array.isArray(data) ? data : data.guests || []);
    } catch (err) {
      console.error("Error fetching guests:", err);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await apiFetch("/api/rooms?status=available");
      const data = await response.json();
      setRooms(Array.isArray(data) ? data : data.rooms || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleRoomChange = (roomId) => {
    setFormData((prev) => ({ ...prev, room_id: roomId }));
    setError("");
  };

  const handleGuestChange = (e) => {
    setFormData((prev) => ({ ...prev, guest_id: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!formData.guest_id) {
      setError("Please select a guest");
      setLoading(false);
      return;
    }

    if (!formData.room_id) {
      setError("Please select a room");
      setLoading(false);
      return;
    }

    if (!formData.check_in_date) {
      setError("Check-in date is required");
      setLoading(false);
      return;
    }

    if (!formData.check_in_time) {
      setError("Check-in time is required");
      setLoading(false);
      return;
    }

    if (!formData.check_out_date) {
      setError("Check-out date is required");
      setLoading(false);
      return;
    }

    if (!formData.check_out_time) {
      setError("Check-out time is required");
      setLoading(false);
      return;
    }

    if (new Date(formData.check_out_date) <= new Date(formData.check_in_date)) {
      setError("Check-out date must be after check-in date");
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: parseInt(formData.guest_id),
          room_id: parseInt(formData.room_id),
          check_in_date: formData.check_in_date,
          check_in_time: formData.check_in_time,
          check_out_date: formData.check_out_date,
          check_out_time: formData.check_out_time,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create booking");
        setLoading(false);
        return;
      }

      setSuccess("Booking created successfully!");
      setTimeout(() => {
        onSuccess(data);
        onClose();
      }, 1000);
    } catch (err) {
      setError("Failed to connect to server");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <button className="modalCloseBtn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modalHeader">
          <h2>Create New Booking</h2>
        </div>

        <form className="modalForm" onSubmit={handleSubmit}>
          <div className="formGroup">
            <label htmlFor="guest_id">Guest *</label>
            <select
              id="guest_id"
              name="guest_id"
              value={formData.guest_id}
              onChange={handleGuestChange}
              disabled={loading}
            >
              <option value="">Select a guest...</option>
              {guests.map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {guest.name}
                </option>
              ))}
            </select>
          </div>

          {formData.guest_id && (() => {
            const selectedGuest = guests.find((guest) => String(guest.id) === String(formData.guest_id));
            if (!selectedGuest) return null;

            return (
              <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" }}>
                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{selectedGuest.name}</div>
                <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{selectedGuest.email}</div>
                <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{selectedGuest.phone}</div>
              </div>
            );
          })()}

          <RoomSearchSelect
            id="room_id"
            name="room_id"
            label="Room *"
            rooms={rooms}
            value={formData.room_id}
            onChange={handleRoomChange}
            disabled={loading}
            availableOnly
          />

          <div className="formGroup">
            <label htmlFor="check_in_date">Check-in Date *</label>
            <input
              id="check_in_date"
              type="date"
              name="check_in_date"
              value={formData.check_in_date}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="check_in_time">Check-in Time *</label>
            <input
              id="check_in_time"
              type="time"
              name="check_in_time"
              value={formData.check_in_time}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="check_out_date">Check-out Date *</label>
            <input
              id="check_out_date"
              type="date"
              name="check_out_date"
              value={formData.check_out_date}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="check_out_time">Check-out Time *</label>
            <input
              id="check_out_time"
              type="time"
              name="check_out_time"
              value={formData.check_out_time}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {error && <div className="formError">❌ {error}</div>}
          {success && <div className="formSuccess">✓ {success}</div>}

          <div className="modalFooter">
            <button
              type="button"
              className="btnCancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btnSubmit"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
