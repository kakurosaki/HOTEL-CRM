import { Router } from "express";
import { pool } from "../db.js";

const router = Router();
const validStatuses = new Set(["checked-in", "reserved", "checked-out"]);

const computeGuestStatus = (checkInDate, checkInTime, checkOutDate, checkOutTime) => {
  const now = new Date();
  const checkIn = new Date(`${checkInDate}T${checkInTime}:00`);
  const checkOut = new Date(`${checkOutDate}T${checkOutTime}:00`);

  if (now >= checkOut) return "checked-out";
  if (now >= checkIn) return "checked-in";
  return "reserved";
};

// Get all guests
router.get("/", async (req, res) => {
  try {
    const { status, room_id } = req.query;
    const params = [];
    const where = [];

    if (status && status !== "all" && validStatuses.has(status)) {
      params.push(status);
      where.push(`g.status = $${params.length}`);
    }

    if (room_id) {
      params.push(room_id);
      where.push(`g.room_id = $${params.length}`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT
        g.id,
        g.name,
        g.email,
        g.phone,
        g.room_id,
        r.room_number,
        g.check_in_date,
        g.check_in_time,
        g.check_out_date,
        g.check_out_time,
        CASE
          WHEN CURRENT_DATE > g.check_out_date
            OR (CURRENT_DATE = g.check_out_date AND CURRENT_TIME >= g.check_out_time)
            THEN 'checked-out'
          WHEN CURRENT_DATE > g.check_in_date
            OR (CURRENT_DATE = g.check_in_date AND CURRENT_TIME >= g.check_in_time)
            THEN 'checked-in'
          ELSE 'reserved'
        END AS status,
        g.created_at
      FROM guests g
      JOIN rooms r ON g.room_id = r.id
      ${whereSql}
      ORDER BY g.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching guests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get guest by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
        g.id,
        g.name,
        g.email,
        g.phone,
        g.room_id,
        r.room_number,
        g.check_in_date,
        g.check_in_time,
        g.check_out_date,
        g.check_out_time,
        CASE
          WHEN CURRENT_DATE > g.check_out_date
            OR (CURRENT_DATE = g.check_out_date AND CURRENT_TIME >= g.check_out_time)
            THEN 'checked-out'
          WHEN CURRENT_DATE > g.check_in_date
            OR (CURRENT_DATE = g.check_in_date AND CURRENT_TIME >= g.check_in_time)
            THEN 'checked-in'
          ELSE 'reserved'
        END AS status,
        g.created_at
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

// Create guest
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      room_id,
      check_in_date,
      check_in_time,
      check_out_date,
      check_out_time,
      status,
    } = req.body;

    if (!name || !email || !phone || !room_id || !check_in_date || !check_in_time || !check_out_date || !check_out_time || !status) {
      return res.status(400).json({ error: "All guest fields are required" });
    }

    if (!validStatuses.has(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const calculatedStatus = computeGuestStatus(check_in_date, check_in_time, check_out_date, check_out_time);
    const result = await pool.query(
      `INSERT INTO guests (
        name, email, phone, room_id, check_in_date, check_in_time, check_out_date, check_out_time, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [name, email, phone, room_id, check_in_date, check_in_time, check_out_date, check_out_time, calculatedStatus]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating guest:", error);
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Update guest
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      room_id,
      check_in_date,
      check_in_time,
      check_out_date,
      check_out_time,
      status,
    } = req.body;

    if (!name || !email || !phone || !room_id || !check_in_date || !check_in_time || !check_out_date || !check_out_time || !status) {
      return res.status(400).json({ error: "All guest fields are required" });
    }

    if (!validStatuses.has(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const calculatedStatus = computeGuestStatus(check_in_date, check_in_time, check_out_date, check_out_time);
    const result = await pool.query(
      `UPDATE guests
      SET name = $1, email = $2, phone = $3, room_id = $4, check_in_date = $5, check_in_time = $6, check_out_date = $7, check_out_time = $8, status = $9
      WHERE id = $10 RETURNING *`,
      [name, email, phone, room_id, check_in_date, check_in_time, check_out_date, check_out_time, calculatedStatus, id]
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

// Delete guest
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM guests WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    res.json({ message: "Guest deleted", guest: result.rows[0] });
  } catch (error) {
    console.error("Error deleting guest:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
