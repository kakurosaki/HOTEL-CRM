import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { username, email, phone, role, password } = req.body;

    // Validate required fields
    if (!username || !email || !phone || !role || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Validate role
    if (!["Admin", "Staff"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM staff WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User with this email or username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      "INSERT INTO staff (username, email, phone, role, password_hashed) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, phone, role",
      [username, email, phone, role, hashedPassword]
    );

    const newUser = result.rows[0];
    res.status(201).json({ 
      message: "User registered successfully", 
      user: newUser 
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

export default router;
