import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET all bookings
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.id, b.guest_id, b.room_id, g.name as guest_name, r.room_number,
             b.check_in_date, b.check_in_time, b.check_out_date, b.check_out_time,
             CAST((b.check_out_date - b.check_in_date) AS INT) as nights,
             b.total_price, b.status, b.created_at
      FROM bookings b
      JOIN guests g ON b.guest_id = g.id
      JOIN rooms r ON b.room_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND b.status = $${params.length + 1}`;
      params.push(status);
    }

    query += " ORDER BY b.check_in_date DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET single booking
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.id, b.guest_id, b.room_id, g.name as guest_name, r.room_number,
              b.check_in_date, b.check_in_time, b.check_out_date, b.check_out_time,
              CAST((b.check_out_date - b.check_in_date) AS INT) as nights,
              b.total_price, b.status, b.created_at
       FROM bookings b
       JOIN guests g ON b.guest_id = g.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.id = $1`,
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

// POST create booking
router.post("/", async (req, res) => {
  try {
    const { guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status } = req.body;

    if (!guest_id || !room_id || !check_in_date || !check_in_time || !check_out_date || !check_out_time || !total_price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO bookings (guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status`,
      [guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status || 'confirmed']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update booking
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status } = req.body;

    const result = await pool.query(
      `UPDATE bookings 
       SET guest_id = COALESCE($1, guest_id),
           room_id = COALESCE($2, room_id),
           check_in_date = COALESCE($3, check_in_date),
           check_in_time = COALESCE($4, check_in_time),
           check_out_date = COALESCE($5, check_out_date),
           check_out_time = COALESCE($6, check_out_time),
           total_price = COALESCE($7, total_price),
           status = COALESCE($8, status)
       WHERE id = $9
       RETURNING id, guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status`,
      [guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE booking
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM bookings WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;