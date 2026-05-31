import { Router } from "express";
import { pool } from "../db.js";
import { getAuditActor, recordAudit } from "../utils/audit.js";

const router = Router();

const guestProfileSql = `
  SELECT g.id, g.name, g.email, g.phone,
         latest_booking.room_id, latest_booking.room_number,
         latest_booking.check_in_date, latest_booking.check_in_time,
         latest_booking.check_out_date, latest_booking.check_out_time,
         COALESCE(latest_booking.status, 'no-booking') AS status
  FROM guests g
  LEFT JOIN LATERAL (
    SELECT b.room_id, r.room_number, b.check_in_date, b.check_in_time, b.check_out_date, b.check_out_time, b.status
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    WHERE b.guest_id = g.id
    ORDER BY b.created_at DESC
    LIMIT 1
  ) latest_booking ON true
`;

const guestProfileWrappedSql = `(${guestProfileSql}) AS guest_summary`;

// GET all guests with filters
router.get("/", async (req, res) => {
  try {
    const { search, status, room_id } = req.query;
    let query = `SELECT * FROM ${guestProfileWrappedSql} WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND (guest_summary.name ILIKE $${params.length + 1} OR guest_summary.email ILIKE $${params.length + 1} OR COALESCE(guest_summary.room_number, '') ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (status) {
      query += ` AND guest_summary.status = $${params.length + 1}`;
      params.push(status);
    }

    if (room_id) {
      query += ` AND guest_summary.room_id = $${params.length + 1}`;
      params.push(room_id);
    }

    query += ` ORDER BY guest_summary.name ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching guests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET single guest
router.get("/:id/history", async (req, res) => {
  try {
    const { id } = req.params;

    const guestResult = await pool.query(
      `SELECT * FROM ${guestProfileWrappedSql} WHERE guest_summary.id = $1`,
      [id]
    );

    if (guestResult.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    const bookingsResult = await pool.query(
      `SELECT b.id, b.status, b.total_price, b.check_in_date, b.check_in_time, b.check_out_date, b.check_out_time, r.room_number, r.room_type
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.guest_id = $1
       ORDER BY b.check_in_date DESC, b.check_in_time DESC`,
      [id]
    );

    let activityRows = [];
    try {
      const auditLookup = await pool.query(
        `SELECT id, action, entity_type, entity_id, entity_name, actor, metadata, created_at
         FROM audit_logs
         WHERE (entity_type = 'guest' AND entity_id = $1::text)
            OR (entity_type = 'booking' AND metadata->>'guest_id' = $1::text)
         ORDER BY created_at DESC
         LIMIT 20`,
        [id]
      );
      activityRows = auditLookup.rows;
    } catch (auditError) {
      if (auditError.code !== "42P01") {
        throw auditError;
      }
    }

    res.json({ guest: guestResult.rows[0], bookings: bookingsResult.rows, activity: activityRows });
  } catch (error) {
    console.error("Error fetching guest history:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM ${guestProfileWrappedSql} WHERE guest_summary.id = $1`,
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
    const { name, email, phone } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      `INSERT INTO guests (name, email, phone)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, phone`,
      [name, email, phone]
    );

    await recordAudit({
      action: "create",
      entityType: "guest",
      entityId: result.rows[0].id,
      entityName: result.rows[0].name,
      actor: getAuditActor(req),
      metadata: { email, phone },
    });

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
    const { name, email, phone } = req.body;

    const result = await pool.query(
      `UPDATE guests 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email),
           phone = COALESCE($3, phone)
       WHERE id = $4
       RETURNING id, name, email, phone`,
      [name, email, phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    await recordAudit({
      action: "update",
      entityType: "guest",
      entityId: result.rows[0].id,
      entityName: result.rows[0].name,
      actor: getAuditActor(req),
      metadata: { email, phone },
    });

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

    await recordAudit({
      action: "delete",
      entityType: "guest",
      entityId: result.rows[0].id,
      entityName: `Guest #${result.rows[0].id}`,
      actor: getAuditActor(req),
      metadata: {},
    });

    res.json({ message: "Guest deleted successfully" });
  } catch (error) {
    console.error("Error deleting guest:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;