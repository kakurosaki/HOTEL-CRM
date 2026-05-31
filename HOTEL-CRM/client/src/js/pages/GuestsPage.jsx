import React, { useEffect, useState } from "react";
import AddGuestModal from "../components/AddGuestModal";
import GuestDetailsModal from "../components/GuestDetailsModal";
import { apiFetch } from "../utils/api";

const statusColors = {
  "checked-in": "#10b981",
  "confirmed": "#3b82f6",
  "pending": "#eab308",
  "checked-out": "#9ca3af",
  "cancelled": "#ef4444",
  "no-show": "#7c3aed",
  "no-booking": "#64748b",
};

export default function GuestsPage() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showModal, setShowModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [savingGuestId, setSavingGuestId] = useState(null);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const response = await apiFetch("/api/guests");
      const data = await response.json();
      setGuests(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching guests:", error);
      setLoading(false);
    }
  };

  const handleAddGuest = async () => {
    await fetchGuests();
  };

  const handleSaveGuest = async (guestId, payload) => {
    try {
      setSavingGuestId(guestId);
      const response = await apiFetch(`/api/guests/${guestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Error updating guest");
        return null;
      }

      setGuests((prev) => prev.map((guest) => (guest.id === guestId ? { ...guest, ...data } : guest)));
      setSelectedGuest((prev) => (prev && prev.id === guestId ? { ...prev, ...data } : prev));
      return data;
    } catch (error) {
      console.error("Error updating guest:", error);
      alert("Error updating guest");
      return null;
    } finally {
      setSavingGuestId(null);
    }
  };

  const filteredGuests = guests.filter(guest =>
    (guest.name.toLowerCase().includes(search.toLowerCase()) ||
      guest.email.toLowerCase().includes(search.toLowerCase()) ||
      (guest.room_number || "").includes(search)) &&
    (statusFilter === "All Status" || (guest.status || "no-booking").toLowerCase() === statusFilter.toLowerCase())
  );

  return (
    <div className="crmPage">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Guests</h1>
          <p className="pageLead">Guest profiles stay clean; bookings carry the stay history.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="crmActionButton"
          style={{ padding: "0.8rem 1.2rem" }}
        >
          Add Guest
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search guests by name, email, or room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", fontSize: "1rem" }}
        />
      </div>

      <div className="toolbar" style={{ marginBottom: "1.5rem" }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "0.85rem 1rem", fontSize: "1rem" }}
        >
          <option>All Status</option>
          <option>no-booking</option>
          <option>confirmed</option>
          <option>pending</option>
          <option>checked-in</option>
          <option>checked-out</option>
          <option>cancelled</option>
          <option>no-show</option>
        </select>
      </div>

      {loading ? (
        <div className="surfaceCard panel">Loading guests...</div>
      ) : (
        <div className="surfaceCard panel" style={{ overflowX: "auto" }}>
          <table className="dataTable">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "600" }}>GUEST</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "600" }}>CONTACT</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "600" }}>ROOM</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "600" }}>CHECK-IN</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "600" }}>CHECK-OUT</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "600" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr
                  key={guest.id}
                  onClick={() => setSelectedGuest(guest)}
                  style={{ borderBottom: "1px solid #e2e8f0", cursor: "pointer" }}
                >
                  <td style={{ padding: "1rem" }}>{guest.name}</td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                      <div>📧 {guest.email}</div>
                      <div>📱 {guest.phone}</div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>{guest.room_number || "No booking yet"}</td>
                  <td style={{ padding: "1rem" }}>{guest.check_in_date || "—"}</td>
                  <td style={{ padding: "1rem" }}>{guest.check_out_date || "—"}</td>
                  <td style={{ padding: "1rem" }}>
                    <span className="statusPill" style={{ backgroundColor: statusColors[guest.status] || statusColors["no-booking"] }}>
                      {guest.status || "no-booking"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddGuestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleAddGuest}
      />

      <GuestDetailsModal
        isOpen={Boolean(selectedGuest)}
        guest={selectedGuest}
        loading={savingGuestId === selectedGuest?.id}
        onClose={() => setSelectedGuest(null)}
        onSave={handleSaveGuest}
      />
    </div>
  );
}