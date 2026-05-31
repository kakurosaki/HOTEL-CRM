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
import { ensureRoomStatusSchema, syncAllRoomStatuses } from "./utils/roomStatusAutomation.js";
import { pool } from "./db.js";

dotenv.config();

// CloudFront origin / security settings
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || "d1to0licb5spp5.cloudfront.net";
const ORIGIN_SECRET = process.env.ORIGIN_SECRET || "7e3b9f1a2c4d6f8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2";

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

// Ensure CloudFront domain is allowed for CORS when present
if (CLOUDFRONT_DOMAIN) {
  const cfOrigin = `https://${CLOUDFRONT_DOMAIN}`;
  if (!allowedOrigins.includes(cfOrigin)) {
    allowedOrigins.push(cfOrigin);
  }
}

const app = express();

// Trust the first proxy (CloudFront) so Express and middleware
// (like express-rate-limit) correctly interpret the client IP
// from X-Forwarded-For. See express docs: app.set('trust proxy', 1)
app.set('trust proxy', 1);
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api", apiLimiter);

// Require CloudFront origin secret for any /api requests when ORIGIN_SECRET is set.
if (ORIGIN_SECRET) {
  app.use("/api", (req, res, next) => {
    const secret = req.get("x-origin-secret");
    if (secret && secret === ORIGIN_SECRET) {
      return next();
    }
    console.warn("Blocked API request missing or invalid x-origin-secret header from", req.ip);
    return res.status(403).send("Forbidden");
  });
}

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

let server;

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  clearInterval(roomStatusSyncTimer);
  if (!server) {
    try {
      await pool.end();
    } catch (e) {
      console.error("Error during pool shutdown:", e);
    }
    process.exit(1);
    return;
  }
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
let roomStatusSyncTimer;

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

const startServer = async () => {
  await ensureRoomStatusSchema();

  server = app.listen(port, host, () => {
    console.log(`✅ API running on ${host}:${port}`);
    const dbUrl = process.env.DATABASE_URL || "(not set)";
    const safeDb = dbUrl.startsWith("postgres") ? dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, "//$1:*****@") : dbUrl;
    console.log(`📝 Environment: DATABASE_URL = ${safeDb}`);
    if (allowedOrigins.length > 0) {
      console.log(`🌍 CORS origins: ${allowedOrigins.join(", ")}`);
    }
  });

  await runRoomStatusSync();
  roomStatusSyncTimer = setInterval(runRoomStatusSync, ROOM_STATUS_SYNC_INTERVAL_MS);
  roomStatusSyncTimer.unref?.();
};

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});

// Error handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});
