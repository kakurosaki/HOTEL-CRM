import { Router } from "express";
import { pool } from "../db.js";
import { findRoomConflicts } from "../utils/availability.js";
import { getAuditActor, recordAudit } from "../utils/audit.js";
import { syncRoomStatusForRoom } from "../utils/roomStatusAutomation.js";

const router = Router();

const isActiveBookingStatus = (status) => {
  return ["confirmed", "pending", "checked-in"].includes((status || "").toLowerCase());
};

const calculateNights = (checkInDate, checkOutDate) => {
  const start = new Date(`${checkInDate}T00:00:00Z`);
  const end = new Date(`${checkOutDate}T00:00:00Z`);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 1);
};

const calculateTotalPrice = (pricePerNight, checkInDate, checkOutDate) => {
  const nights = calculateNights(checkInDate, checkOutDate);
  return Number((Number(pricePerNight) * nights).toFixed(2));
};

const canUseRoomForBooking = async (client, roomId, bookingId = null) => {
  const params = [roomId];
  let query = "SELECT id, status, price_per_night FROM rooms WHERE id = $1";

  const roomResult = await client.query(query, params);
  if (roomResult.rows.length === 0) {
    return { ok: false, status: 404, error: "Room not found" };
  }

  const room = roomResult.rows[0];
  if (room.status !== "available") {
    return { ok: false, status: 409, error: "Room is not available for booking" };
  }

  return { ok: true, room };
};

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
  const client = await pool.connect();
  try {
    const { guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status } = req.body;

    if (!guest_id || !room_id || !check_in_date || !check_in_time || !check_out_date || !check_out_time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (new Date(check_out_date) <= new Date(check_in_date)) {
      return res.status(400).json({ error: "Check-out date must be after check-in date" });
    }

    const roomCheck = await canUseRoomForBooking(client, room_id);
    if (!roomCheck.ok) {
      return res.status(roomCheck.status).json({ error: roomCheck.error });
    }

    const bookingTotalPrice = total_price === undefined || total_price === null || total_price === ""
      ? calculateTotalPrice(roomCheck.room.price_per_night, check_in_date, check_out_date)
      : Number(total_price);

    const conflicts = await findRoomConflicts({
      roomId: room_id,
      startDate: check_in_date,
      startTime: check_in_time,
      endDate: check_out_date,
      endTime: check_out_time,
    });

    if (conflicts.length > 0) {
      return res.status(409).json({ error: "Selected room is already booked for the chosen dates" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO bookings (guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status`,
      [guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, bookingTotalPrice, status || 'confirmed']
    );

    await syncRoomStatusForRoom(client, room_id);

    await client.query("COMMIT");

    await recordAudit({
      action: "create",
      entityType: "booking",
      entityId: result.rows[0].id,
      entityName: `Booking #${result.rows[0].id}`,
      actor: getAuditActor(req),
      metadata: { guest_id, room_id, status: status || "confirmed", total_price: bookingTotalPrice },
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_rollbackError) {
      // ignore rollback errors
    }
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// PUT update booking
router.put("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { guest_id, room_id, check_in_date, check_in_time, check_out_date, check_out_time, total_price, status } = req.body;

    const existingBookingResult = await client.query(
      "SELECT id, room_id, status FROM bookings WHERE id = $1",
      [id]
    );

    if (existingBookingResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const existingBooking = existingBookingResult.rows[0];
    const targetRoomId = room_id || existingBooking.room_id;

    if (room_id) {
      const roomResult = await client.query("SELECT id, status FROM rooms WHERE id = $1", [room_id]);
      if (roomResult.rows.length === 0) {
        return res.status(404).json({ error: "Room not found" });
      }

      if (roomResult.rows[0].status !== "available" && String(room_id) !== String(existingBooking.room_id)) {
        return res.status(409).json({ error: "Room is not available for booking" });
      }
    }

    if (targetRoomId && check_in_date && check_in_time && check_out_date && check_out_time) {
      const conflicts = await findRoomConflicts({
        roomId: targetRoomId,
        startDate: check_in_date,
        startTime: check_in_time,
        endDate: check_out_date,
        endTime: check_out_time,
        excludeBookingId: id,
      });

      if (conflicts.length > 0) {
        return res.status(409).json({ error: "Selected room is already booked for the chosen dates" });
      }
    }

    await client.query("BEGIN");

    const result = await client.query(
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

    const nextStatus = result.rows[0].status;
    const previousRoomId = existingBooking.room_id;
    const nextRoomId = result.rows[0].room_id;

    await syncRoomStatusForRoom(client, nextRoomId);
    if (String(previousRoomId) !== String(nextRoomId)) {
      await syncRoomStatusForRoom(client, previousRoomId);
    }

    await client.query("COMMIT");

    await recordAudit({
      action: "update",
      entityType: "booking",
      entityId: result.rows[0].id,
      entityName: `Booking #${result.rows[0].id}`,
      actor: getAuditActor(req),
      metadata: { guest_id, room_id, status, total_price },
    });

    res.json(result.rows[0]);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_rollbackError) {
      // ignore rollback errors
    }
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// DELETE booking
router.delete("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const existingBookingResult = await client.query("SELECT id, room_id, status FROM bookings WHERE id = $1", [id]);
    if (existingBookingResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const existingBooking = existingBookingResult.rows[0];

    await client.query("BEGIN");

    const result = await client.query("DELETE FROM bookings WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Booking not found" });
    }

    await syncRoomStatusForRoom(client, existingBooking.room_id);
    await client.query("COMMIT");

    await recordAudit({
      action: "delete",
      entityType: "booking",
      entityId: result.rows[0].id,
      entityName: `Booking #${result.rows[0].id}`,
      actor: getAuditActor(req),
      metadata: {},
    });

    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_rollbackError) {
      // ignore rollback errors
    }
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

export default router;