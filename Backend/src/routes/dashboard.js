import { Router } from "express";
import { pool } from "../db.js";

const router = Router();
const bookingStatusSql = `
  CASE
    WHEN CURRENT_DATE > b.check_out_date
      OR (CURRENT_DATE = b.check_out_date AND CURRENT_TIME >= b.check_out_time)
      THEN 'checked-out'
    WHEN CURRENT_DATE > b.check_in_date
      OR (CURRENT_DATE = b.check_in_date AND CURRENT_TIME >= b.check_in_time)
      THEN 'checked-in'
    ELSE 'reserved'
  END
`;

// Get dashboard stats
const getStats = async (_req, res) => {
  try {
    const activeGuestsResult = await pool.query(
      `SELECT COUNT(DISTINCT b.guest_id) AS count
       FROM bookings b
       WHERE b.check_in_date <= CURRENT_DATE
         AND b.check_out_date >= CURRENT_DATE
         AND b.status IN ('confirmed', 'checked-in', 'pending')`
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

router.get("/summary", async (_req, res) => {
  try {
    const [arrivalsTodayResult, departuresTodayResult, occupancyResult, pendingBookingsResult, housekeepingResult] = await Promise.all([
      pool.query("SELECT COUNT(*) AS count FROM bookings WHERE check_in_date = CURRENT_DATE"),
      pool.query("SELECT COUNT(*) AS count FROM bookings WHERE check_out_date = CURRENT_DATE"),
      pool.query("SELECT COUNT(DISTINCT b.room_id) AS occupied FROM bookings b WHERE b.check_in_date <= CURRENT_DATE AND b.check_out_date >= CURRENT_DATE AND b.status IN ('confirmed','checked-in','pending')"),
      pool.query("SELECT COUNT(*) AS count FROM bookings WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status = 'cleaning') AS cleaning, COUNT(*) FILTER (WHERE status = 'maintenance') AS maintenance FROM rooms"),
    ]);

    let recentActivity = [];
    try {
      const activityResult = await pool.query(
        `SELECT id, action, entity_type, entity_id, entity_name, actor, metadata, created_at
         FROM audit_logs
         ORDER BY created_at DESC
         LIMIT 10`
      );
      recentActivity = activityResult.rows;
    } catch (activityError) {
      if (activityError.code !== "42P01") {
        throw activityError;
      }
    }

    const totalRoomsResult = await pool.query("SELECT COUNT(*) AS count FROM rooms");
    const occupiedRooms = parseInt(occupancyResult.rows[0].occupied, 10);
    const totalRooms = parseInt(totalRoomsResult.rows[0].count, 10);

    res.json({
      arrivalsToday: parseInt(arrivalsTodayResult.rows[0].count, 10),
      departuresToday: parseInt(departuresTodayResult.rows[0].count, 10),
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      pendingBookings: parseInt(pendingBookingsResult.rows[0].count, 10),
      cleaningRooms: parseInt(housekeepingResult.rows[0].cleaning, 10),
      maintenanceRooms: parseInt(housekeepingResult.rows[0].maintenance, 10),
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({ error: "Server error" });
  }
});

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
      `SELECT g.id, g.name, g.email, r.room_number, b.check_out_date
       FROM bookings b
       JOIN guests g ON b.guest_id = g.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.check_in_date <= CURRENT_DATE
         AND b.check_out_date >= CURRENT_DATE
         AND b.status IN ('confirmed','checked-in','pending')
       ORDER BY b.check_out_date ASC, b.check_out_time ASC
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