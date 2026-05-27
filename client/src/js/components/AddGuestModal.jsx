import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import "../../css/modal.css";

export default function AddGuestModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    room_id: "",
    check_in_date: "",
    check_in_time: "",
    check_out_date: "",
    check_out_time: "",
    status: "reserved",
  });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [isOpen]);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      setRooms(data.rooms || []);
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

    if (!formData.name || !formData.email || !formData.phone || !formData.room_id || !formData.check_in_date || !formData.check_in_time || !formData.check_out_date || !formData.check_out_time || !formData.status) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email");
      setLoading(false);
      return;
    }

    const phoneRegex = /^\+1 \(\d{3}\) \d{3}-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Phone must match format +1 (555) 123-4567");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          room_id: parseInt(formData.room_id, 10),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add guest");
        setLoading(false);
        return;
      }

      setSuccess("Guest added successfully!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        room_id: "",
        check_in_date: "",
        check_in_time: "",
        check_out_date: "",
        check_out_time: "",
        status: "reserved",
      });

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
          <h2>Add New Guest</h2>
        </div>

        <form className="modalForm" onSubmit={handleSubmit}>
          <div className="formGroup">
            <label htmlFor="name">Guest Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Enter guest name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="phone">Phone *</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="room_id">Room *</label>
            <select id="room_id" name="room_id" value={formData.room_id} onChange={handleChange} disabled={loading}>
              <option value="">Select room...</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.room_number} ({room.room_type})
                </option>
              ))}
            </select>
          </div>

          <div className="formGroup">
            <label htmlFor="check_in_date">Check-in Date *</label>
            <input id="check_in_date" type="date" name="check_in_date" value={formData.check_in_date} onChange={handleChange} disabled={loading} />
          </div>

          <div className="formGroup">
            <label htmlFor="check_in_time">Check-in Time *</label>
            <input id="check_in_time" type="time" name="check_in_time" value={formData.check_in_time} onChange={handleChange} disabled={loading} />
          </div>

          <div className="formGroup">
            <label htmlFor="check_out_date">Check-out Date *</label>
            <input id="check_out_date" type="date" name="check_out_date" value={formData.check_out_date} onChange={handleChange} disabled={loading} />
          </div>

          <div className="formGroup">
            <label htmlFor="check_out_time">Check-out Time *</label>
            <input id="check_out_time" type="time" name="check_out_time" value={formData.check_out_time} onChange={handleChange} disabled={loading} />
          </div>

          <div className="formGroup">
            <label htmlFor="status">Status *</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} disabled={loading}>
              <option value="checked-in">checked-in</option>
              <option value="reserved">reserved</option>
              <option value="checked-out">checked-out</option>
            </select>
          </div>

          {error && <div className="formError">❌ {error}</div>}
          {success && <div className="formSuccess">✓ {success}</div>}

          <div className="modalFooter">
            <button type="button" className="btnCancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btnSubmit" disabled={loading}>
              {loading ? "Adding..." : "Add Guest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
