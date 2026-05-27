import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Get all rooms
router.get("/", async (req, res) => {
  try {
    const { type, status } = req.query;
    const params = [];
    const where = [];

    if (type && type !== "all") {
      params.push(type);
      where.push(`room_type = $${params.length}`);
    }

    if (status && status !== "all") {
      params.push(status);
      where.push(`status = $${params.length}`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT * FROM rooms ${whereSql} ORDER BY room_number ASC`,
      params
    );

    const summaryResult = await pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM rooms
       GROUP BY status`
    );

    const summary = {
      available: 0,
      occupied: 0,
      cleaning: 0,
      maintenance: 0,
    };

    summaryResult.rows.forEach((row) => {
      summary[row.status] = row.count;
    });

    res.json({ rooms: result.rows, summary });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get room stats
router.get("/stats/summary", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT status, COUNT(*)::int AS count FROM rooms GROUP BY status`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching room stats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get room by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM rooms WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update room status
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE rooms SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
