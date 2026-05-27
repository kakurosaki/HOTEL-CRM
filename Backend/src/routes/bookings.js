import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Get all bookings
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT b.*, g.name as guest_name, g.email, r.room_number FROM bookings b JOIN guests g ON b.guest_id = g.id JOIN rooms r ON b.room_id = r.id ORDER BY b.created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get booking by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT b.*, g.name as guest_name, g.email, r.room_number FROM bookings b JOIN guests g ON b.guest_id = g.id JOIN rooms r ON b.room_id = r.id WHERE b.id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create booking
router.post("/", async (req, res) => {
  try {
    const {
      guest_id,
      room_id,
      check_in_date,
      check_in_time,
      check_out_date,
      check_out_time,
      total_price,
      status,
    } = req.body;

    if (!guest_id || !room_id || !check_in_date || !check_in_time || !check_out_date || !check_out_time) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      `INSERT INTO bookings (
        guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price || null, status || "confirmed"]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update booking status
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query("UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *", [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete booking
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM bookings WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ message: "Booking deleted", booking: result.rows[0] });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
