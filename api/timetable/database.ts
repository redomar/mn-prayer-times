import { drizzle } from "drizzle-orm/node-postgres";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const DB = new SQLDatabase("prayer-timetable", {
  migrations: {
    path: "./migrations",
    source: "drizzle",
  },
});

const db = drizzle(DB.connectionString);

export { db };
