import "server-only";
import { drizzle } from "drizzle-orm/neon-http";
import { getDatabaseUrl } from "@/server/env";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;
let database: Database | undefined;

export function getDb(): Database {
  if (!database) database = drizzle(getDatabaseUrl(), { schema });
  return database;
}
