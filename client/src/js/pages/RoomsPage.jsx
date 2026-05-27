import React, { useEffect, useState } from "react";

const typeOptions = ["all", "Standard", "Deluxe", "Suite", "Presidential"];
const statusOptions = ["all", "available", "occupied", "cleaning", "maintenance"];

const statusColors = {
  available: "#10b981",
  occupied: "#ef4444",
  cleaning: "#eab308",
  maintenance: "#f97316",
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [summary, setSummary] = useState({ available: 0, occupied: 0, cleaning: 0, maintenance: 0 });
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, [typeFilter, statusFilter]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/rooms${params.toString() ? `?${params.toString()}` : ""}`);
      const data = await response.json();
      setRooms(data.rooms || []);
      setSummary(data.summary || { available: 0, occupied: 0, cleaning: 0, maintenance: 0 });
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Rooms</h1>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
          <option value="all">All Types</option>
          {typeOptions.filter((x) => x !== "all").map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
          <option value="all">All Status</option>
          {statusOptions.filter((x) => x !== "all").map((status) => (
            <option key={status} value={status}>
              {status[0].toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "1rem", marginBottom: "1rem" }}>
        <div style={cardStyle}><strong>Available:</strong> {summary.available}</div>
        <div style={cardStyle}><strong>Occupied:</strong> {summary.occupied}</div>
        <div style={cardStyle}><strong>Cleaning:</strong> {summary.cleaning}</div>
        <div style={cardStyle}><strong>Maintenance:</strong> {summary.maintenance}</div>
      </div>

      {loading ? (
        <p>Loading rooms...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1rem" }}>
          {rooms.map((room) => (
            <div key={room.id} style={cardStyle}>
              <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>🏨 Room {room.room_number}</div>
              <div style={{ color: "#475569", marginBottom: "0.5rem" }}>{room.room_type}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.7rem", borderRadius: "9999px", backgroundColor: `${statusColors[room.status] || "#64748b"}22`, color: statusColors[room.status] || "#64748b", fontWeight: 600, textTransform: "capitalize", marginBottom: "0.5rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: statusColors[room.status] || "#64748b" }} />
                {room.status}
              </div>
              <div style={{ color: "#0f172a", fontWeight: 600 }}>${room.price_per_night}/night</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
