import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import loginRouter from "./routes/login.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/login", loginRouter);

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`API running on port ${port}`);
});
