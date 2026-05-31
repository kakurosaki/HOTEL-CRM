import { pool } from "../db.js";
import { recordAudit } from "./audit.js";

const BOOKING_STATUSES = ["confirmed", "pending", "checked-in"];
const SYNCABLE_ROOM_STATUSES = ["available", "reserved", "occupied", "cleaning"];

export const isBookingActiveNow = (booking) => {
  if (!booking) {
    return false;
  }

  const start = new Date(`${booking.check_in_date}T${String(booking.check_in_time).slice(0, 8)}`);
  const end = new Date(`${booking.check_out_date}T${String(booking.check_out_time).slice(0, 8)}`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  const now = new Date();
  return start <= now && end > now;
};

export const syncRoomStatusForRoom = async (client, roomId) => {
  const roomResult = await client.query(
    "SELECT id, room_number, status FROM rooms WHERE id = $1",
    [roomId]
  );

  if (roomResult.rows.length === 0) {
    return { updated: false, reason: "room-not-found" };
  }

  const room = roomResult.rows[0];
  if (!SYNCABLE_ROOM_STATUSES.includes(room.status)) {
    return { updated: false, reason: "room-status-locked", room };
  }

  const [occupiedBookingResult, cleaningBookingResult, reservedBookingResult] = await Promise.all([
    client.query(
      `SELECT EXISTS (
         SELECT 1
         FROM bookings
         WHERE room_id = $1
           AND status = ANY($2)
           AND (check_in_date + check_in_time) <= CURRENT_TIMESTAMP
           AND (check_out_date + check_out_time) > CURRENT_TIMESTAMP
       ) AS active`,
      [roomId, BOOKING_STATUSES]
    ),
    client.query(
      `SELECT EXISTS (
         SELECT 1
         FROM bookings
         WHERE room_id = $1
           AND status = ANY($2)
           AND (check_out_date + check_out_time) <= CURRENT_TIMESTAMP
           AND (check_out_date + check_out_time) > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
       ) AS cleaning`,
      [roomId, BOOKING_STATUSES]
    ),
    client.query(
      `SELECT EXISTS (
         SELECT 1
         FROM bookings
         WHERE room_id = $1
           AND status = ANY($2)
           AND (check_in_date + check_in_time) > CURRENT_TIMESTAMP
       ) AS reserved`,
      [roomId, BOOKING_STATUSES]
    ),
  ]);

  let nextStatus = "available";
  if (occupiedBookingResult.rows[0].active) {
    nextStatus = "occupied";
  } else if (cleaningBookingResult.rows[0].cleaning) {
    nextStatus = "cleaning";
  } else if (reservedBookingResult.rows[0].reserved) {
    nextStatus = "reserved";
  }

  if (room.status === nextStatus) {
    return { updated: false, room: { ...room, status: nextStatus } };
  }

  await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [nextStatus, roomId]);

  return { updated: true, room: { ...room, status: nextStatus } };
};

export const syncAllRoomStatuses = async () => {
  const client = await pool.connect();
  try {
    const roomResult = await client.query(
      "SELECT id FROM rooms WHERE status = ANY($1)",
      [SYNCABLE_ROOM_STATUSES]
    );

    let updatedCount = 0;
    for (const row of roomResult.rows) {
      const syncResult = await syncRoomStatusForRoom(client, row.id);
      if (syncResult.updated) {
        updatedCount += 1;
      }
    }

    if (updatedCount > 0) {
      await recordAudit({
        action: "sync",
        entityType: "room-status",
        entityId: "batch",
        entityName: "Room status sync",
        actor: "system",
        metadata: { updatedCount },
      });
    }

    return { updatedCount };
  } finally {
    client.release();
  }
};

export const ensureRoomStatusSchema = async () => {
  const client = await pool.connect();
  try {
    const constraintResult = await client.query(
      `SELECT conname, pg_get_constraintdef(c.oid) AS definition
       FROM pg_constraint c
       JOIN pg_class rel ON rel.oid = c.conrelid
       JOIN pg_namespace ns ON ns.oid = rel.relnamespace
       WHERE rel.relname = 'rooms'
         AND ns.nspname = current_schema()
         AND c.contype = 'c'
         AND pg_get_constraintdef(c.oid) ILIKE '%status%'`
    );

    const hasReserved = constraintResult.rows.some((row) => String(row.definition || "").includes("reserved"));
    if (hasReserved) {
      return { updated: false, reason: "already-updated" };
    }

    for (const row of constraintResult.rows) {
      const constraintName = String(row.conname || "").replace(/"/g, '""');
      if (constraintName) {
        await client.query(`ALTER TABLE rooms DROP CONSTRAINT IF EXISTS "${constraintName}"`);
      }
    }

    await client.query(
      `ALTER TABLE rooms
       ADD CONSTRAINT rooms_status_check
       CHECK (status IN ('available', 'reserved', 'occupied', 'cleaning', 'maintenance'))`
    );

    return { updated: true };
  } finally {
    client.release();
  }
};