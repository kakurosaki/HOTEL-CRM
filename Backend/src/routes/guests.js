import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Get all guests
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM guests ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching guests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get guest by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM guests WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching guest:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create guest
router.post("/", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const result = await pool.query(
      "INSERT INTO guests (name, email, phone) VALUES ($1, $2, $3) RETURNING *",
      [name, email, phone || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating guest:", error);
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Update guest
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const result = await pool.query(
      "UPDATE guests SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *",
      [name, email, phone || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating guest:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete guest
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM guests WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    res.json({ message: "Guest deleted", guest: result.rows[0] });
  } catch (error) {
    console.error("Error deleting guest:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Search guests
router.get("/search/query", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query required" });
    }

    const result = await pool.query(
      "SELECT * FROM guests WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 ORDER BY created_at DESC",
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error searching guests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
