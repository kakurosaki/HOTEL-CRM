import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import loginRouter from "./routes/login.js";
import registerRouter from "./routes/register.js";
import guestsRouter from "./routes/guests.js";
import bookingsRouter from "./routes/bookings.js";
import roomsRouter from "./routes/rooms.js";
import dashboardRouter from "./routes/dashboard.js";
import auditRouter from "./routes/audit.js";
import { syncAllRoomStatuses } from "./utils/roomStatusAutomation.js";
import { pool } from "./db.js";

dotenv.config();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = allowedOrigins.length > 0
  ? {
      origin: allowedOrigins,
      credentials: true,
    }
  : undefined;

const app = express();
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api", apiLimiter);

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use("/api/login", loginRouter);
app.use("/api/register", registerRouter);
app.use("/api/guests", guestsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/audit", auditRouter);

const port = process.env.PORT || 5000;
const host = process.env.HOST || "0.0.0.0";

const server = app.listen(port, host, () => {
  console.log(`✅ API running on ${host}:${port}`);
  const dbUrl = process.env.DATABASE_URL || "(not set)";
  const safeDb = dbUrl.startsWith("postgres") ? dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, "//$1:*****@") : dbUrl;
  console.log(`📝 Environment: DATABASE_URL = ${safeDb}`);
  if (allowedOrigins.length > 0) {
    console.log(`🌍 CORS origins: ${allowedOrigins.join(", ")}`);
  }
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  clearInterval(roomStatusSyncTimer);
  server.close(async (err) => {
    if (err) {
      console.error("Error closing server:", err);
      process.exit(1);
    }
    try {
      await pool.end();
      console.log("✅ Database pool closed");
      process.exit(0);
    } catch (e) {
      console.error("Error during pool shutdown:", e);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

const ROOM_STATUS_SYNC_INTERVAL_MS = 5 * 60 * 1000;

const runRoomStatusSync = async () => {
  try {
    const result = await syncAllRoomStatuses();
    if (result.updatedCount > 0) {
      console.log(`🔄 Room status sync updated ${result.updatedCount} room(s)`);
    }
  } catch (error) {
    console.error("Error syncing room statuses:", error);
  }
};

runRoomStatusSync();
const roomStatusSyncTimer = setInterval(runRoomStatusSync, ROOM_STATUS_SYNC_INTERVAL_MS);
roomStatusSyncTimer.unref?.();

// Error handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});
