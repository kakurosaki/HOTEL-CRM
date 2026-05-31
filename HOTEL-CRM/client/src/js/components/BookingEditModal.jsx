import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import RoomSearchSelect from "./RoomSearchSelect";
import "../../css/modal.css";

const emptyForm = {
  guest_id: "",
  room_id: "",
  check_in_date: "",
  check_in_time: "",
  check_out_date: "",
  check_out_time: "",
  total_price: "",
  status: "confirmed",
};

const formatDateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
};

const formatTimeValue = (value) => {
  if (!value) return "";
  if (typeof value === "string" && value.includes(":")) {
    return value.slice(0, 5);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 5);
  }
  return date.toISOString().slice(11, 16);
};

export default function BookingEditModal({ isOpen, booking, guests, rooms, onClose, onSave, onDelete, loadingId, canDelete = true }) {
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      setFormData({
        guest_id: booking.guest_id ? String(booking.guest_id) : "",
        room_id: booking.room_id ? String(booking.room_id) : "",
        check_in_date: formatDateValue(booking.check_in_date),
        check_in_time: formatTimeValue(booking.check_in_time),
        check_out_date: formatDateValue(booking.check_out_date),
        check_out_time: formatTimeValue(booking.check_out_time),
        total_price: booking.total_price ?? "",
        status: booking.status || "confirmed",
      });
      setError("");
      setSaving(false);
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleRoomChange = (roomId) => {
    setFormData((prev) => ({ ...prev, room_id: roomId }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    if (!formData.guest_id || !formData.room_id || !formData.check_in_date || !formData.check_in_time || !formData.check_out_date || !formData.check_out_time) {
      setError("All booking fields are required");
      setSaving(false);
      return;
    }

    if (new Date(formData.check_out_date) <= new Date(formData.check_in_date)) {
      setError("Check-out date must be after check-in date");
      setSaving(false);
      return;
    }

    const savedBooking = await onSave(booking.id, {
      ...formData,
      guest_id: parseInt(formData.guest_id, 10),
      room_id: parseInt(formData.room_id, 10),
      total_price: formData.total_price === "" ? null : Number(formData.total_price),
    });

    if (!savedBooking) {
      setSaving(false);
      return;
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(event) => event.stopPropagation()}>
        <button className="modalCloseBtn" onClick={onClose} disabled={saving || loadingId === booking.id}>
          <X size={24} />
        </button>

        <div className="modalHeader">
          <h2>Edit Booking #{booking.id}</h2>
        </div>

        <form className="modalForm" onSubmit={handleSubmit}>
          <div className="formGroup">
            <label htmlFor="booking-guest">Guest *</label>
            <select id="booking-guest" name="guest_id" value={formData.guest_id} onChange={handleChange} disabled={saving || loadingId === booking.id}>
              <option value="">Select a guest...</option>
              {guests.map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {guest.name}
                </option>
              ))}
            </select>
          </div>

          <RoomSearchSelect
            id="booking-room"
            name="room_id"
            label="Room *"
            rooms={rooms}
            value={formData.room_id}
            onChange={handleRoomChange}
            disabled={saving || loadingId === booking.id}
            availableOnly
            keepSelectedRoomVisible
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="formGroup">
              <label htmlFor="booking-check-in-date">Check-in Date *</label>
              <input id="booking-check-in-date" name="check_in_date" type="date" value={formData.check_in_date} onChange={handleChange} disabled={saving || loadingId === booking.id} />
            </div>
            <div className="formGroup">
              <label htmlFor="booking-check-in-time">Check-in Time *</label>
              <input id="booking-check-in-time" name="check_in_time" type="time" value={formData.check_in_time} onChange={handleChange} disabled={saving || loadingId === booking.id} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="formGroup">
              <label htmlFor="booking-check-out-date">Check-out Date *</label>
              <input id="booking-check-out-date" name="check_out_date" type="date" value={formData.check_out_date} onChange={handleChange} disabled={saving || loadingId === booking.id} />
            </div>
            <div className="formGroup">
              <label htmlFor="booking-check-out-time">Check-out Time *</label>
              <input id="booking-check-out-time" name="check_out_time" type="time" value={formData.check_out_time} onChange={handleChange} disabled={saving || loadingId === booking.id} />
            </div>
          </div>

          <div className="formGroup">
            <label htmlFor="booking-total-price">Total Price</label>
            <input id="booking-total-price" name="total_price" type="number" min="0" step="0.01" value={formData.total_price} onChange={handleChange} disabled={saving || loadingId === booking.id} />
          </div>

          <div className="formGroup">
            <label htmlFor="booking-status">Status</label>
            <select id="booking-status" name="status" value={formData.status} onChange={handleChange} disabled={saving || loadingId === booking.id}>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="checked-in">Checked-in</option>
              <option value="checked-out">Checked-out</option>
              <option value="no-show">No-show</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {error && <div className="formError">❌ {error}</div>}

          <div className="modalFooter" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            {canDelete && (
              <button
                type="button"
                className="btnCancel"
                onClick={() => onDelete(booking)}
                disabled={loadingId === booking.id}
                style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
              >
                Delete Booking
              </button>
            )}

            <div style={{ display: "flex", gap: "1rem" }}>
              <button type="button" className="btnCancel" onClick={onClose} disabled={saving || loadingId === booking.id}>
                Close
              </button>
              <button type="submit" className="btnSubmit" disabled={saving || loadingId === booking.id}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}