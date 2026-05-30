import { pool } from "../db.js";
import { recordAudit } from "./audit.js";

const ACTIVE_BOOKING_STATUSES = ["confirmed", "pending", "checked-in"];
const SYNCABLE_ROOM_STATUSES = ["available", "occupied"];

const getActiveRoomSql = `
  SELECT 1
  FROM bookings
  WHERE room_id = $1
    AND status = ANY($2)
    AND (check_in_date + check_in_time) <= CURRENT_TIMESTAMP
    AND (check_out_date + check_out_time) > CURRENT_TIMESTAMP
  LIMIT 1
`;

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

  const activeBookingResult = await client.query(
    `SELECT EXISTS (${getActiveRoomSql}) AS active`,
    [roomId, ACTIVE_BOOKING_STATUSES]
  );

  const nextStatus = activeBookingResult.rows[0].active ? "occupied" : "available";

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