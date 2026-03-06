import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await pool.query ("SELECT * FROM staff WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const staff = result.rows[0];
    const passCompare = await bcrypt.compare(password, staff.password_hashed);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { password_hashed, ...staffData } = staff;
    res.json({ message: "Login successful", staff: staffData });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
    
  }

});