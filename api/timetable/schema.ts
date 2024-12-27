// schema.ts
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(), // e.g., 'LDN', 'BIRM', 'MANC'
  description: text("description"),
});

/** 
 [date: string]: { // e.g., '2023-12-31': {
        asr: string;
        asr_2: string;
        asr_jamat: string;
        date: string;
        dhuhr: string;
        dhuhr_jamat: string;
        fajr: string;
        fajr_jamat: string;
        isha: string;
        isha_jamat: string;
        magrib: string;
        magrib_jamat: string;
        sunrise: string;
      };
 */
// interface PrayerTimes {
//   [key: string]: {
//     asr: string;
//     asr_2: string;
//     asr_jamat: string;
//     date: string;
//     dhuhr: string;
//     dhuhr_jamat: string;
//     fajr: string;
//     fajr_jamat: string;
//     isha: string;
//     isha_jamat: string;
//     magrib: string;
//     magrib_jamat: string;
//     sunrise: string;
//   };
// }

const prayerTimes = pgTable("prayer_times", {
  id: serial("id").primaryKey(),
  locationId: serial("location_id").references(() => locations.id),
  date: varchar("date", { length: 10 }).notNull(),
  fajr: varchar("fajr", { length: 5 }),
  fajrJamat: varchar("fajr_jamat", { length: 5 }),
  dhuhr: varchar("dhuhr", { length: 5 }),
  dhuhrJamat: varchar("dhuhr_jamat", { length: 5 }),
  asr: varchar("asr", { length: 5 }),
  asr2: varchar("asr2", { length: 5 }),
  asrJamat: varchar("asr_jamat", { length: 5 }),
  maghrib: varchar("maghrib", { length: 5 }),
  maghribJamat: varchar("maghrib_jamat", { length: 5 }),
  isha: varchar("isha", { length: 5 }),
  ishaJamat: varchar("isha_jamat", { length: 5 }),
  sunrise: varchar("sunrise", { length: 5 }),
});

export { locations, prayerTimes };
