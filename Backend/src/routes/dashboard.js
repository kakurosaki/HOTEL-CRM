import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Get dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const activeGuestsResult = await pool.query(
      "SELECT COUNT(DISTINCT guest_id) as count FROM bookings WHERE check_out_date >= CURRENT_DATE AND status = 'confirmed'"
    );

    const totalBookingsResult = await pool.query(
      "SELECT COUNT(*) as count FROM bookings"
    );

    const availableRoomsResult = await pool.query(
      "SELECT COUNT(*) as count FROM rooms WHERE status = 'available'"
    );

    const monthlyRevenueResult = await pool.query(
      "SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE EXTRACT(MONTH FROM check_in_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM check_in_date) = EXTRACT(YEAR FROM CURRENT_DATE)"
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
});

// Get recent bookings
router.get("/bookings/recent", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT b.id, g.name as guest_name, r.room_number, b.total_price, CAST(EXTRACT(DAY FROM b.check_out_date - b.check_in_date) AS INT) as nights FROM bookings b JOIN guests g ON b.guest_id = g.id JOIN rooms r ON b.room_id = r.id ORDER BY b.created_at DESC LIMIT 5"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching recent bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get current guests
router.get("/guests/current", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT g.id, g.name, g.email, r.room_number, b.check_out_date FROM bookings b JOIN guests g ON b.guest_id = g.id JOIN rooms r ON b.room_id = r.id WHERE b.check_in_date <= CURRENT_DATE AND b.check_out_date >= CURRENT_DATE AND b.status = 'confirmed' ORDER BY b.check_out_date ASC LIMIT 3"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching current guests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
