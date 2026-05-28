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
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMode, setSettingsMode] = useState(null); // "add", "edit", "delete"
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [selectedDeleteRoom, setSelectedDeleteRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    room_number: "",
    room_type: "Standard",
    price_per_night: "",
    status: "available"
  });

  const types = ["All Types", "Standard", "Deluxe", "Suite", "Presidential"];
  const statuses = ["All Status", "available", "occupied", "cleaning", "maintenance"];
  const roomTypes = ["Standard", "Deluxe", "Suite", "Presidential"];
  const roomStatuses = ["available", "occupied", "cleaning", "maintenance"];

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

  const handleAddRoom = async (e) => {
    e.preventDefault();
    
    if (!formData.room_number || !formData.room_type || !formData.price_per_night || !formData.status) {
      alert("All fields are required");
      return;
    }

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_number: formData.room_number,
          room_type: formData.room_type,
          price_per_night: parseFloat(formData.price_per_night),
          status: formData.status
        })
      });

      if (response.ok) {
        setFormData({ room_number: "", room_type: "Standard", price_per_night: "", status: "available" });
        setShowAddModal(false);
        fetchRooms();
        fetchStats();
        alert("Room added successfully!");
      } else {
        alert("Error adding room");
      }
    } catch (error) {
      console.error("Error adding room:", error);
      alert("Error adding room");
    }
  };

  const handleEditRoom = async (e) => {
    e.preventDefault();
    
    if (!formData.room_number || !formData.room_type || !formData.price_per_night || !formData.status) {
      alert("All fields are required");
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${editingRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_number: formData.room_number,
          room_type: formData.room_type,
          price_per_night: parseFloat(formData.price_per_night),
          status: formData.status
        })
      });

      if (response.ok) {
        setFormData({ room_number: "", room_type: "Standard", price_per_night: "", status: "available" });
        setShowEditModal(false);
        setEditingRoom(null);
        setSettingsMode(null);
        setSearchQuery("");
        fetchRooms();
        fetchStats();
        alert("Room updated successfully!");
      } else {
        alert("Error updating room");
      }
    } catch (error) {
      console.error("Error updating room:", error);
      alert("Error updating room");
    }
  };

  const handleDeleteRoom = async () => {
    if (deleteConfirmText !== `delete ${selectedDeleteRoom.room_number}`) {
      alert(`Please type "delete ${selectedDeleteRoom.room_number}" to confirm`);
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${selectedDeleteRoom.id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setDeleteConfirmText("");
        setSelectedDeleteRoom(null);
        setSettingsMode(null);
        setSearchQuery("");
        fetchRooms();
        fetchStats();
        alert("Room deleted successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error deleting room: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Error deleting room");
    }
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      price_per_night: room.price_per_night,
      status: room.status
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingRoom(null);
    setFormData({ room_number: "", room_type: "Standard", price_per_night: "", status: "available" });
  };

  const filteredRooms = rooms.filter(room =>
    room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.room_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modalStyle = {
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
  };

  const modalContentStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "2rem",
    maxWidth: "600px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto"
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1>Rooms</h1>
        <button
          onClick={() => {
            setShowSettings(true);
            setSettingsMode(null);
            setSearchQuery("");
          }}
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

      {/* Room Settings Modal - Main Menu */}
      {showSettings && !settingsMode && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2 style={{ marginTop: 0 }}>Room Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  fontSize: "1.5rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button
                onClick={() => {
                  setSettingsMode("add");
                  setShowAddModal(true);
                  setFormData({ room_number: "", room_type: "Standard", price_per_night: "", status: "available" });
                }}
                style={{
                  padding: "1rem",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "600"
                }}
              >
                ➕ Add Room
              </button>

              <button
                onClick={() => setSettingsMode("edit")}
                style={{
                  padding: "1rem",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "600"
                }}
              >
                ✏️ Edit Room
              </button>

              <button
                onClick={() => setSettingsMode("delete")}
                style={{
                  padding: "1rem",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "600"
                }}
              >
                🗑️ Delete Room
              </button>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              style={{
                marginTop: "2rem",
                width: "100%",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#e5e7eb",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ marginTop: 0 }}>Add New Room</h2>
            <form onSubmit={handleAddRoom}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Room Number *</label>
                <input
                  type="text"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="e.g., 101, 102, 201"
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Room Type *</label>
                <select
                  value={formData.room_type}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                >
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Price per Night ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                  placeholder="e.g., 120.00"
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                >
                  {roomStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    closeModals();
                    setShowSettings(true);
                    setSettingsMode(null);
                  }}
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
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "600"
                  }}
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room - Select Room */}
      {showSettings && settingsMode === "edit" && !showEditModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ marginTop: 0 }}>Select Room to Edit</h2>
              <button
                onClick={() => {
                  setSettingsMode(null);
                  setShowSettings(true);
                  setSearchQuery("");
                }}
                style={{
                  fontSize: "1.5rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <input
                type="text"
                placeholder="Search by room number or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", maxHeight: "400px", overflowY: "auto" }}>
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => openEditModal(room)}
                  style={{
                    padding: "1rem",
                    backgroundColor: "white",
                    border: `2px solid ${statusColorMap[room.status].bg}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                >
                  <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Room {room.room_number}</div>
                  <div style={{ fontSize: "0.9rem", color: "#64748b" }}>{room.room_type}</div>
                  <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>${room.price_per_night}/night</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSettingsMode(null);
                setShowSettings(true);
                setSearchQuery("");
              }}
              style={{
                marginTop: "1.5rem",
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#e5e7eb",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ marginTop: 0 }}>Edit Room {editingRoom.room_number}</h2>
            <form onSubmit={handleEditRoom}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Room Number *</label>
                <input
                  type="text"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Room Type *</label>
                <select
                  value={formData.room_type}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                >
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Price per Night ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: "4px", boxSizing: "border-box" }}
                >
                  {roomStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    closeModals();
                    setShowSettings(true);
                    setSettingsMode("edit");
                    setSearchQuery("");
                  }}
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
                    backgroundColor: "#f59e0b",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "600"
                  }}
                >
                  Update Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Room - Select Room */}
      {showSettings && settingsMode === "delete" && !selectedDeleteRoom && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ marginTop: 0 }}>Select Room to Delete</h2>
              <button
                onClick={() => {
                  setSettingsMode(null);
                  setShowSettings(true);
                  setSearchQuery("");
                }}
                style={{
                  fontSize: "1.5rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <input
                type="text"
                placeholder="Search by room number or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", maxHeight: "400px", overflowY: "auto" }}>
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedDeleteRoom(room)}
                  style={{
                    padding: "1rem",
                    backgroundColor: "white",
                    border: "2px solid #ef4444",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#fef2f2"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                >
                  <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Room {room.room_number}</div>
                  <div style={{ fontSize: "0.9rem", color: "#64748b" }}>{room.room_type}</div>
                  <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>${room.price_per_night}/night</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSettingsMode(null);
                setShowSettings(true);
                setSearchQuery("");
              }}
              style={{
                marginTop: "1.5rem",
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#e5e7eb",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation */}
      {selectedDeleteRoom && (
        <div style={modalStyle}>
          <div style={{ ...modalContentStyle, maxWidth: "500px" }}>
            <h2 style={{ marginTop: 0 }}>Delete Room {selectedDeleteRoom.room_number}?</h2>
            <p style={{ color: "#64748b", marginBottom: "1rem" }}>
              This action cannot be undone. Type <strong>delete {selectedDeleteRoom.room_number}</strong> to confirm deletion.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`delete ${selectedDeleteRoom.room_number}`}
                style={{ 
                  width: "100%", 
                  padding: "0.75rem", 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "4px", 
                  boxSizing: "border-box",
                  fontSize: "1rem"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setSelectedDeleteRoom(null);
                  setDeleteConfirmText("");
                  setShowSettings(true);
                  setSettingsMode("delete");
                  setSearchQuery("");
                }}
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
                onClick={handleDeleteRoom}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "600"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
