import { Router } from "express";
import { pool } from "../db.js";
import { getAuditActor, recordAudit } from "../utils/audit.js";

const router = Router();

// GET all rooms with filters
router.get("/", async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = "SELECT id, room_number, room_type, price_per_night, status FROM rooms WHERE 1=1";
    const params = [];

    if (type && type !== "All Types") {
      query += ` AND room_type = $${params.length + 1}`;
      params.push(type);
    }

    if (status && status !== "All Status") {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += " ORDER BY room_number ASC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET room statistics
router.get("/stats", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN status = 'cleaning' THEN 1 END) as cleaning,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
        COUNT(*) as total
      FROM rooms
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching room stats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET single room
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, room_number, room_type, price_per_night, status FROM rooms WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create room
router.post("/", async (req, res) => {
  try {
    const { room_number, room_type, price_per_night, status } = req.body;

    if (!room_number || !room_type || !price_per_night) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO rooms (room_number, room_type, price_per_night, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, room_number, room_type, price_per_night, status`,
      [room_number, room_type, price_per_night, status || 'available']
    );

    await recordAudit({
      action: "create",
      entityType: "room",
      entityId: result.rows[0].id,
      entityName: `Room ${result.rows[0].room_number}`,
      actor: getAuditActor(req),
      metadata: { room_type, price_per_night, status: status || "available" },
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating room:", error);
    if (error.code === '23505') {
      return res.status(400).json({ error: "Room number already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update room
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, room_type, price_per_night, status } = req.body;

    const result = await pool.query(
      `UPDATE rooms 
       SET room_number = COALESCE($1, room_number),
           room_type = COALESCE($2, room_type),
           price_per_night = COALESCE($3, price_per_night),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING id, room_number, room_type, price_per_night, status`,
      [room_number, room_type, price_per_night, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    await recordAudit({
      action: "update",
      entityType: "room",
      entityId: result.rows[0].id,
      entityName: `Room ${result.rows[0].room_number}`,
      actor: getAuditActor(req),
      metadata: { room_number, room_type, price_per_night, status },
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE room
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "DELETE FROM rooms WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    await recordAudit({
      action: "delete",
      entityType: "room",
      entityId: result.rows[0].id,
      entityName: `Room #${result.rows[0].id}`,
      actor: getAuditActor(req),
      metadata: {},
    });

    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
