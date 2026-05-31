import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const sslMode = new URL(connectionString || "postgres://localhost").searchParams.get("sslmode");
const shouldUseSsl = Boolean(sslMode && sslMode !== "disable");

let ssl;
if (shouldUseSsl) {
  const caPath = process.env.NODE_EXTRA_CA_CERTS || process.env.GLOBAL_BUNDLE_PATH;
  const resolvedCaPath = caPath ? path.resolve(process.cwd(), caPath) : null;

  if (resolvedCaPath && fs.existsSync(resolvedCaPath)) {
    ssl = {
      rejectUnauthorized: sslMode === "verify-full",
      ca: fs.readFileSync(resolvedCaPath, "utf8"),
    };
  } else {
    ssl = {
      rejectUnauthorized: sslMode === "verify-full",
    };
  }
}

export const pool = new Pool({
  connectionString,
  ssl,
  connectionTimeoutMillis: 10000,
});