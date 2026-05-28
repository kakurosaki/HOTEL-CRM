import React, { useEffect, useState } from "react";

const statusColors = {
  "checked-in": "#10b981",
  "reserved": "#3b82f6",
  "checked-out": "#9ca3af"
};

export default function GuestsPage() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    room_id: "",
    check_in_date: "",
    check_in_time: "",
    check_out_date: "",
    check_out_time: "",
    status: "reserved"
  });

  useEffect(() => {
    fetchGuests();
    fetchRooms();
  }, []);

  const fetchGuests = async () => {
    try {
      const response = await fetch("/api/guests");
      const data = await response.json();
      setGuests(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching guests:", error);
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.room_id || 
        !formData.check_in_date || !formData.check_in_time || 
        !formData.check_out_date || !formData.check_out_time) {
      alert("All fields are required");
      return;
    }

    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({
          name: "",
          email: "",
          phone: "",
          room_id: "",
          check_in_date: "",
          check_in_time: "",
          check_out_date: "",
          check_out_time: "",
          status: "reserved"
        });
        setShowModal(false);
        fetchGuests();
      } else {
        alert("Error adding guest");
      }
    } catch (error) {
      console.error("Error adding guest:", error);
      alert("Error adding guest");
    }
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(search.toLowerCase()) ||
    guest.email.toLowerCase().includes(search.toLowerCase()) ||
    guest.room_number.includes(search)
  );

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1>Guests</h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600"
          }}
        >
          Add Guest
        </button>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search guests by name, email, or room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "1rem"
          }}
        />
      </div>

      {loading ? (
        <p>Loading guests...</p>
      ) : (
        <div style={{ overflowX: "auto", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                <tr key={guest.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "1rem" }}>{guest.name}</td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                      <div>📧 {guest.email}</div>
                      <div>📱 {guest.phone}</div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>{guest.room_number}</td>
                  <td style={{ padding: "1rem" }}>{guest.check_in_date}</td>
                  <td style={{ padding: "1rem" }}>{guest.check_out_date}</td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        backgroundColor: statusColors[guest.status],
                        color: "white",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        fontWeight: "500"
                      }}
                    >
                      {guest.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "2rem",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h2 style={{ marginTop: 0 }}>Add Guest</h2>
            <form onSubmit={handleAddGuest}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Guest Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Room *</label>
                <select
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                  required
                >
                  <option value="">Select a room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.room_number} - {room.room_type} (${room.price_per_night}/night)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Check-in Date *</label>
                  <input
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Check-in Time *</label>
                  <input
                    type="time"
                    value={formData.check_in_time}
                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Check-out Date *</label>
                  <input
                    type="date"
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Check-out Time *</label>
                  <input
                    type="time"
                    value={formData.check_out_time}
                    onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                >
                  <option value="checked-in">Checked-in</option>
                  <option value="reserved">Reserved</option>
                  <option value="checked-out">Checked-out</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    fontSize: "1rem"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "600"
                  }}
                >
                  Add Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}