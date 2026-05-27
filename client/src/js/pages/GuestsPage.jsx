import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import AddGuestModal from "../components/AddGuestModal";
import "../../css/guests.css";

export default function GuestsPage() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredGuests, setFilteredGuests] = useState([]);

  useEffect(() => {
    fetchGuests();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredGuests(guests);
    } else {
      const filtered = guests.filter(
        (guest) =>
          guest.name.toLowerCase().includes(search.toLowerCase()) ||
          guest.email.toLowerCase().includes(search.toLowerCase()) ||
          (guest.phone && guest.phone.includes(search))
      );
      setFilteredGuests(filtered);
    }
  }, [search, guests]);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/guests");
      const data = await response.json();
      setGuests(data);
    } catch (error) {
      console.error("Error fetching guests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = (newGuest) => {
    setGuests([newGuest, ...guests]);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Guests</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Plus size={20} /> Add Guest
        </button>
      </div>

      <div style={{ marginBottom: "1.5rem", position: "relative" }}>
        <Search
          size={20}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
          }}
        />
        <input
          type="text"
          placeholder="Search guests by name, email, or room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem 1rem 0.75rem 2.5rem",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "1rem",
          }}
        />
      </div>

      {loading ? (
        <p>Loading guests...</p>
      ) : filteredGuests.length === 0 ? (
        <p>No guests found.</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>GUEST</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>CONTACT</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "600", color: "#475569" }}>PHONE</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr key={guest.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "1rem" }}>{guest.name}</td>
                  <td style={{ padding: "1rem" }}>{guest.email}</td>
                  <td style={{ padding: "1rem" }}>{guest.phone || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddGuestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddGuest}
      />
    </div>
  );
}
