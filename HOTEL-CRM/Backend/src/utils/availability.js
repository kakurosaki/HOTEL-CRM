import { pool } from "../db.js";

const buildRangeSql = (tableAlias) =>
  `tsrange((${tableAlias}.check_in_date + ${tableAlias}.check_in_time), (${tableAlias}.check_out_date + ${tableAlias}.check_out_time), '[)')`;

export const findRoomConflicts = async ({
  roomId,
  startDate,
  startTime,
  endDate,
  endTime,
  excludeBookingId = null,
}) => {
  const requestedRangeSql = `tsrange(($2::date + $3::time), ($4::date + $5::time), '[)')`;

  const bookingParams = [roomId, startDate, startTime, endDate, endTime];
  let bookingExcludeClause = "";
  if (excludeBookingId !== null && excludeBookingId !== undefined) {
    bookingParams.push(excludeBookingId);
    bookingExcludeClause = ` AND b.id <> $${bookingParams.length}`;
  }

  const bookingQuery = `
    SELECT 'booking' AS source, b.id, g.name, b.room_id, b.check_in_date, b.check_in_time, b.check_out_date, b.check_out_time
    FROM bookings b
    JOIN guests g ON b.guest_id = g.id
    WHERE b.room_id = $1
      AND ${buildRangeSql("b")} && ${requestedRangeSql}
      ${bookingExcludeClause}
  `;

  const bookingResult = await pool.query(bookingQuery, bookingParams);

  return bookingResult.rows;
};