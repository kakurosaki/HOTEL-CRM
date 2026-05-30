import { Router } from "express";
import { fetchRecentAuditLogs } from "../utils/audit.js";

const router = Router();

router.get("/recent", async (_req, res) => {
  try {
    const rows = await fetchRecentAuditLogs(25);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;