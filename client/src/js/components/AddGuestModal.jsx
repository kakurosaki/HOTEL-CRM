import React, { useState } from "react";
import { X } from "lucide-react";
import "../../css/modal.css";
import { apiFetch } from "../utils/api";

export default function AddGuestModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    if (!formData.name || !formData.email || !formData.phone) {
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

    // Phone may be any format but must contain exactly 11 digits
    const digitOnlyPhone = String(formData.phone).replace(/\D/g, "");
    if (digitOnlyPhone.length !== 11) {
      setError("Phone must contain exactly 11 digits");
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            phone: digitOnlyPhone,
            name: formData.name,
            email: formData.email,
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
