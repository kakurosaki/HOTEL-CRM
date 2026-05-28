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

// Get dashboard stats
const getStats = async (_req, res) => {
  try {
    const activeGuestsResult = await pool.query(
      `SELECT COUNT(*) AS count FROM guests g WHERE ${guestStatusSql} = 'checked-in'`
    );

    const totalBookingsResult = await pool.query(
      "SELECT COUNT(*) AS count FROM bookings"
    );

    const availableRoomsResult = await pool.query(
      "SELECT COUNT(*) AS count FROM rooms WHERE status = 'available'"
    );

    const monthlyRevenueResult = await pool.query(
      "SELECT COALESCE(SUM(total_price), 0) AS total FROM bookings"
    );

    res.json({
      activeGuests: parseInt(activeGuestsResult.rows[0].count),
      totalBookings: parseInt(totalBookingsResult.rows[0].count),
      availableRooms: parseInt(availableRoomsResult.rows[0].count),
      monthlyRevenue: parseFloat(monthlyRevenueResult.rows[0].total)
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Server error" });
  }
};

router.get("/", getStats);
router.get("/stats", getStats);

// Get recent bookings
const getRecentBookings = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, g.name AS guest_name, r.room_number, b.total_price, 
              CAST((b.check_out_date - b.check_in_date) AS INT) AS nights 
       FROM bookings b 
       JOIN guests g ON b.guest_id = g.id 
       JOIN rooms r ON b.room_id = r.id 
       ORDER BY b.id DESC 
       LIMIT 5`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching recent bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

router.get("/recent-bookings", getRecentBookings);
router.get("/bookings/recent", getRecentBookings);

// Get current guests
const getCurrentGuests = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.id, g.name, g.email, r.room_number, g.check_out_date
       FROM guests g
       JOIN rooms r ON g.room_id = r.id
       WHERE ${guestStatusSql} = 'checked-in'
       ORDER BY g.check_out_date ASC, g.check_out_time ASC
       LIMIT 5`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching current guests:", error);
    res.status(500).json({ error: "Server error" });
  }
};

router.get("/current-guests", getCurrentGuests);
router.get("/guests/current", getCurrentGuests);

export default router;