import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("Không tìm thấy DATABASE_URL trong file .env.local");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
