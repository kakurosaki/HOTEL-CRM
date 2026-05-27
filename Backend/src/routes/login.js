import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    console.log(`🔐 Login attempt for user: ${username}`);

    const result = await pool.query("SELECT * FROM staff WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${username}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const staff = result.rows[0];
    console.log(`✅ User found: ${staff.username}`);
    console.log(`🔑 Password entered length: ${password.length}`);
    console.log(`🔑 Hash from DB: ${staff.password_hashed.substring(0, 20)}...`);

    const passwordMatch = await bcrypt.compare(password, staff.password_hashed);
    console.log(`🔄 Password match result: ${passwordMatch}`);

    if (!passwordMatch) {
      console.log(`❌ Password mismatch for user: ${username}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`✅ Login successful for user: ${username}`);
    const { password_hashed, ...staffData } = staff;
    res.json({ message: "Login successful", staff: staffData });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "Server error" });
  }

});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT id, email FROM staff WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Staff not found" });
    }
    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
