import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

const guestStatusSql = `
  CASE
    WHEN CURRENT_DATE > g.check_out_date
      OR (CURRENT_DATE = g.check_out_date AND CURRENT_TIME >= g.check_out_time)
      THEN 'checked-out'
    WHEN CURRENT_DATE > g.check_in_date
      OR (CURRENT_DATE = g.check_in_date AND CURRENT_TIME >= g.check_in_time)
      THEN 'checked-in'
    ELSE 'reserved'
  END
`;

// GET all guests with filters
router.get("/", async (req, res) => {
  try {
    const { search, status, room_id } = req.query;
    let query = `
      SELECT g.id, g.name, g.email, g.phone, g.room_id, r.room_number, 
             g.check_in_date, g.check_in_time, g.check_out_date, g.check_out_time,
             ${guestStatusSql} as status
      FROM guests g
      JOIN rooms r ON g.room_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (g.name ILIKE $${params.length + 1} OR g.email ILIKE $${params.length + 1} OR r.room_number ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (status) {
      query += ` AND ${guestStatusSql} = $${params.length + 1}`;
      params.push(status);
    }

    if (room_id) {
      query += ` AND g.room_id = $${params.length + 1}`;
      params.push(room_id);
    }

    query += ` ORDER BY g.check_out_date ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching guests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET single guest
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT g.id, g.name, g.email, g.phone, g.room_id, r.room_number,
              g.check_in_date, g.check_in_time, g.check_out_date, g.check_out_time,
              ${guestStatusSql} as status
       FROM guests g
       JOIN rooms r ON g.room_id = r.id
       WHERE g.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching guest:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create guest
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, room_id, check_in_date, check_in_time, check_out_date, check_out_time, status } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !room_id || !check_in_date || !check_in_time || !check_out_date || !check_out_time) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if room exists
    const roomResult = await pool.query("SELECT id FROM rooms WHERE id = $1", [room_id]);
    if (roomResult.rows.length === 0) {
      return res.status(400).json({ error: "Room not found" });
    }

    const result = await pool.query(
      `INSERT INTO guests (name, email, phone, room_id, check_in_date, check_in_time, check_out_date, check_out_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, email, phone, room_id, check_in_date, check_in_time, check_out_date, check_out_time, status`,
      [name, email, phone, room_id, check_in_date, check_in_time, check_out_date, check_out_time, status || 'reserved']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating guest:", error);
    if (error.code === '23505') {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update guest
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, room_id, check_in_date, check_in_time, check_out_date, check_out_time, status } = req.body;

    const result = await pool.query(
      `UPDATE guests 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           room_id = COALESCE($4, room_id),
           check_in_date = COALESCE($5, check_in_date),
           check_in_time = COALESCE($6, check_in_time),
           check_out_date = COALESCE($7, check_out_date),
           check_out_time = COALESCE($8, check_out_time),
           status = COALESCE($9, status)
       WHERE id = $10
       RETURNING id, name, email, phone, room_id, check_in_date, check_in_time, check_out_date, check_out_time, status`,
      [name, email, phone, room_id, check_in_date, check_in_time, check_out_date, check_out_time, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating guest:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE guest
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM guests WHERE id = $1 RETURNING id", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    res.json({ message: "Guest deleted successfully" });
  } catch (error) {
    console.error("Error deleting guest:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;