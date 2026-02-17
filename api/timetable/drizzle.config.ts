import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  out: "migrations",
  schema: "schema.ts",
} satisfies Config;
