import React, { useEffect, useState } from "react";

const statusColorMap = {
  available: { bg: "#10b981", text: "white", dot: "#10b981" },
  occupied: { bg: "#ef4444", text: "white", dot: "#ef4444" },
  cleaning: { bg: "#eab308", text: "white", dot: "#eab308" },
  maintenance: { bg: "#f97316", text: "white", dot: "#f97316" }
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({
    available: 0,
    occupied: 0,
    cleaning: 0,
    maintenance: 0,
    total: 0
  });
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);

  const types = ["All Types", "Standard", "Deluxe", "Suite", "Presidential"];
  const statuses = ["All Status", "available", "occupied", "cleaning", "maintenance"];

  useEffect(() => {
    fetchRooms();
    fetchStats();
  }, [typeFilter, statusFilter]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (typeFilter !== "All Types") {
        params.append("type", typeFilter);
      }
      if (statusFilter !== "All Status") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/rooms?${params.toString()}`);
      const data = await response.json();
      setRooms(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/rooms/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching room stats:", error);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1>Rooms</h1>
        <button
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "500"
          }}
        >
          Room Settings
        </button>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "1rem",
            minWidth: "200px",
            cursor: "pointer"
          }}
        >
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "1rem",
            minWidth: "200px",
            cursor: "pointer"
          }}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {["available", "occupied", "cleaning", "maintenance"].map((status) => (
          <div key={status} style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ textTransform: "capitalize", fontSize: "1rem", color: "#64748b", marginBottom: "0.5rem" }}>
              {status}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: statusColorMap[status].dot }}>
              {stats[status]}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <p>Loading rooms...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {rooms.map((room) => (
            <div
              key={room.id}
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                borderTop: `4px solid ${statusColorMap[room.status].dot}`
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.5rem", marginRight: "0.5rem" }}>🏨</span>
                <span style={{ fontSize: "1.25rem", fontWeight: "600" }}>Room {room.room_number}</span>
              </div>

              <div style={{ marginBottom: "1rem", color: "#64748b", fontSize: "0.95rem" }}>
                {room.room_type}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: statusColorMap[room.status].dot
                  }}
                ></span>
                <span
                  style={{
                    backgroundColor: statusColorMap[room.status].bg,
                    color: statusColorMap[room.status].text,
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    textTransform: "capitalize"
                  }}
                >
                  {room.status}
                </span>
              </div>

              <div style={{ fontSize: "1.25rem", fontWeight: "600", color: "#334155" }}>
                ${room.price_per_night}/night
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}