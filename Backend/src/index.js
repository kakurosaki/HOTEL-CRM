import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import loginRouter from "./routes/login.js";
import guestsRouter from "./routes/guests.js";
import bookingsRouter from "./routes/bookings.js";
import roomsRouter from "./routes/rooms.js";
import dashboardRouter from "./routes/dashboard.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use("/api/login", loginRouter);
app.use("/api/guests", guestsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/dashboard", dashboardRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✅ API running on port ${port}`);
  console.log(`📝 Environment: DATABASE_URL = ${process.env.DATABASE_URL}`);
});

// Error handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});
