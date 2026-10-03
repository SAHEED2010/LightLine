import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { z } from "zod";

config({ path: ".env.local", quiet: true });
const parsed = z.string().url().safeParse(process.env.DATABASE_URL);
if (
  !parsed.success ||
  !["postgres:", "postgresql:"].includes(new URL(parsed.data).protocol)
) {
  console.error(
    "Set a valid server-side DATABASE_URL before running migrations.",
  );
  process.exit(1);
}
try {
  await migrate(drizzle(parsed.data), { migrationsFolder: "./drizzle" });
  console.log("LightLine migrations applied successfully.");
} catch {
  console.error(
    "Migration failed. Verify the selected database, connectivity, and schema permissions.",
  );
  process.exitCode = 1;
}
