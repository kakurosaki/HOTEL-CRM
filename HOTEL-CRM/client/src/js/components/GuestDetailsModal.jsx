import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import "../../css/modal.css";
import { apiFetch } from "../utils/api";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
};

export default function GuestDetailsModal({ isOpen, guest, onClose, onSave, loading }) {
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState({ bookings: [], activity: [] });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    if (isOpen && guest) {
      const fetchHistory = async () => {
        try {
          setHistoryLoading(true);
          setHistoryError("");
          const response = await apiFetch(`/api/guests/${guest.id}/history`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to load guest history");
          }

          setHistory({
            bookings: data.bookings || [],
            activity: data.activity || [],
          });
        } catch (historyFetchError) {
          console.error("Error fetching guest history:", historyFetchError);
          setHistoryError("Failed to load guest history.");
        } finally {
          setHistoryLoading(false);
        }
      };

      setFormData({
        name: guest.name || "",
        email: guest.email || "",
        phone: guest.phone || "",
      });
      setError("");
      setSaving(false);
      setHistory({ bookings: [], activity: [] });
      fetchHistory();
    }
  }, [guest, isOpen]);

  if (!isOpen || !guest) return null;

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

    if (!formData.name || !formData.email || !formData.phone) {
      setError("Guest name, email, and phone are required");
      setSaving(false);
      return;
    }

    const savedGuest = await onSave(guest.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    });

    if (!savedGuest) {
      setSaving(false);
      return;
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(event) => event.stopPropagation()}>
        <button className="modalCloseBtn" onClick={onClose} disabled={saving || loading}>
          <X size={24} />
        </button>

        <div className="modalHeader">
          <h2>Guest Details</h2>
        </div>

        <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" }}>
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Latest Stay</div>
          <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
            {guest.room_number ? `Room ${guest.room_number}` : "No booking yet"}
          </div>
          {guest.check_in_date && guest.check_out_date && (
            <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
              {guest.check_in_date} {guest.check_in_time} to {guest.check_out_date} {guest.check_out_time}
            </div>
          )}
          {guest.status && (
            <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{guest.status}</div>
          )}
        </div>

        <form className="modalForm" onSubmit={handleSubmit}>
          <div className="formGroup">
            <label htmlFor="guest-name">Guest Name *</label>
            <input id="guest-name" name="name" type="text" value={formData.name} onChange={handleChange} disabled={saving || loading} />
          </div>

          <div className="formGroup">
            <label htmlFor="guest-email">Email *</label>
            <input id="guest-email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={saving || loading} />
          </div>

          <div className="formGroup">
            <label htmlFor="guest-phone">Phone *</label>
            <input id="guest-phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={saving || loading} />
          </div>

          {error && <div className="formError">❌ {error}</div>}

          <div style={{ marginTop: "0.5rem" }}>
            <h3 style={{ marginBottom: "0.75rem", fontSize: "1.05rem" }}>Stay History</h3>
            {historyLoading ? (
              <p style={{ margin: 0, color: "#64748b" }}>Loading history...</p>
            ) : historyError ? (
              <p style={{ margin: 0, color: "#dc2626" }}>{historyError}</p>
            ) : history.bookings.length === 0 ? (
              <p style={{ margin: 0, color: "#64748b" }}>No booking history yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {history.bookings.map((booking) => (
                  <div key={booking.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                      <strong>Booking #{booking.id}</strong>
                      <span style={{ color: "#475569" }}>{booking.status}</span>
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "0.35rem" }}>
                      Room {booking.room_number} - {booking.room_type}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#334155", marginTop: "0.35rem" }}>
                      {booking.check_in_date} {booking.check_in_time} to {booking.check_out_date} {booking.check_out_time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: "1.25rem" }}>
            <h3 style={{ marginBottom: "0.75rem", fontSize: "1.05rem" }}>Recent Activity</h3>
            {historyLoading ? (
              <p style={{ margin: 0, color: "#64748b" }}>Loading activity...</p>
            ) : history.activity.length === 0 ? (
              <p style={{ margin: 0, color: "#64748b" }}>No recent activity.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {history.activity.map((item) => (
                  <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.75rem" }}>
                    <div style={{ fontWeight: 600 }}>{item.action.toUpperCase()} · {item.entity_type}</div>
                    <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{item.entity_name || item.entity_id} by {item.actor}</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{new Date(item.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modalFooter">
            <button type="button" className="btnCancel" onClick={onClose} disabled={saving || loading}>
              Close
            </button>
            <button type="submit" className="btnSubmit" disabled={saving || loading}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}