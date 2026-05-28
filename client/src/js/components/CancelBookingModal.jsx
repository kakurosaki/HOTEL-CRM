import React from "react";
import { X } from "lucide-react";
import "../../css/modal.css";

export default function CancelBookingModal({ isOpen, booking, onClose, onConfirm, loading, error }) {
  if (!isOpen || !booking) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <button className="modalCloseBtn" onClick={onClose} disabled={loading}>
          <X size={24} />
        </button>

        <div className="modalHeader">
          <h2>Cancel Booking #{booking.id}?</h2>
        </div>

        <p style={{ margin: 0, color: "#475569" }}>
          This will set the booking status to <strong>cancelled</strong>.
        </p>

        {error && <div className="formError">❌ {error}</div>}

        <div className="modalFooter">
          <button type="button" className="btnCancel" onClick={onClose} disabled={loading}>
            Keep Booking
          </button>
          <button
            type="button"
            className="btnSubmit"
            onClick={() => onConfirm(booking)}
            disabled={loading}
            style={{ backgroundColor: "#dc2626" }}
          >
            {loading ? "Cancelling..." : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
