import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

console.log("Migrating with:", databaseUrl.replace(/:[^:@]+@/, ":****@"));

const pool = new Pool({
  connectionString: databaseUrl,
});

const db = drizzle(pool);

async function runMigrations() {
  try {
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: path.join(__dirname, "drizzle") });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
