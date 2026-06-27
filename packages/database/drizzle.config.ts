import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema/index.ts",
  out: "./supabase/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
  },
} satisfies Config;
