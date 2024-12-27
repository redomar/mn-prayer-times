// schema.ts
import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(), // e.g., 'LDN', 'BIRM', 'MANC'
  description: text("description"),
});

export const prayerTimes = pgTable("prayer_times", {
  id: serial("id").primaryKey(),
  locationId: serial("location_id").references(() => locations.id),
  date: timestamp("date").notNull(),
  fajr: varchar("fajr", { length: 5 }).notNull(),
  dhuhr: varchar("dhuhr", { length: 5 }).notNull(),
  asr: varchar("asr", { length: 5 }).notNull(),
  asr2: varchar("asr2", { length: 5 }).notNull(),
  maghrib: varchar("maghrib", { length: 5 }).notNull(),
  isha: varchar("isha", { length: 5 }).notNull(),
});
