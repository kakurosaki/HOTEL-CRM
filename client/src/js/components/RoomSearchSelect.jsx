import React, { useEffect, useState } from "react";

const formatRoomLabel = (room) => {
  if (!room) return "";
  const roomNumber = room.room_number ?? "";
  const roomType = room.room_type ?? "";
  const price = room.price_per_night ? ` - $${room.price_per_night}/night` : "";
  return `Room ${roomNumber} - ${roomType}${price}`;
};

export default function RoomSearchSelect({
  id,
  name,
  rooms,
  value,
  onChange,
  disabled,
  label,
  placeholder = "Search rooms...",
  availableOnly = false,
  keepSelectedRoomVisible = false,
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedRoom = rooms.find((room) => String(room.id) === String(value));

  useEffect(() => {
    setQuery(selectedRoom ? formatRoomLabel(selectedRoom) : "");
  }, [selectedRoom]);

  const filteredRooms = rooms.filter((room) => {
    if (availableOnly && room.status !== "available" && String(room.id) !== String(value) && !(keepSelectedRoomVisible && String(room.id) === String(value))) {
      return false;
    }

    const searchText = `${room.room_number ?? ""} ${room.room_type ?? ""} ${room.price_per_night ?? ""}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  const handleInputChange = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setIsOpen(true);
    onChange("");
  };

  const handleSelectRoom = (room) => {
    setQuery(formatRoomLabel(room));
    onChange(String(room.id));
    setIsOpen(false);
  };

  return (
    <div className="formGroup">
      <label htmlFor={id}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          name={name}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          disabled={disabled}
          autoComplete="off"
        />

        {isOpen && !disabled && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              backgroundColor: "white",
              border: "1px solid var(--gray-200)",
              borderRadius: "8px",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
              zIndex: 20,
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            {filteredRooms.length === 0 ? (
              <div style={{ padding: "0.85rem 1rem", color: "#64748b" }}>No rooms match your search.</div>
            ) : (
              filteredRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectRoom(room)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: "0.85rem 1rem",
                    cursor: "pointer",
                    borderBottom: "1px solid #e2e8f0",
                    font: "inherit",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{formatRoomLabel(room)}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}