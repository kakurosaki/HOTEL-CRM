import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import "../../css/modal.css";

export default function NewBookingModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    guest_id: "",
    room_id: "",
    check_in_date: "",
    check_out_date: "",
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
      const response = await fetch("/api/guests");
      const data = await response.json();
      setGuests(data);
    } catch (err) {
      console.error("Error fetching guests:", err);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    if (!formData.check_out_date) {
      setError("Check-out date is required");
      setLoading(false);
      return;
    }

    if (new Date(formData.check_out_date) <= new Date(formData.check_in_date)) {
      setError("Check-out date must be after check-in date");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: parseInt(formData.guest_id),
          room_id: parseInt(formData.room_id),
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
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
              onChange={handleChange}
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

          <div className="formGroup">
            <label htmlFor="room_id">Room *</label>
            <select
              id="room_id"
              name="room_id"
              value={formData.room_id}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select a room...</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_number} ({room.room_type}) - ${room.price_per_night}/night
                </option>
              ))}
            </select>
          </div>

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
