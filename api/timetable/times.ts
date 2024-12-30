import { api, APIError } from "encore.dev/api";
import { locations, prayerTimes } from "./schema";
import { db } from "./database";
import { Location } from "./location";
import { eq, sql } from "drizzle-orm";

export interface PrayerTimes {
  id: number;
  locationId: Location["id"];
  location?: Location;
  date: string;
  fajr: string;
  fajrJamat: string;
  dhuhr: string;
  dhuhrJamat: string;
  asr: string;
  asr2: string;
  asrJamat: string;
  maghrib: string;
  maghribJamat: string;
  isha: string;
  ishaJamat: string;
  sunrise: string;
}

export const prayerTimesCreate = api(
  { method: "POST", path: "/times" },
  async (data: PrayerTimes) => {
    const [prayerTime] = await db.insert(prayerTimes).values(data).returning();
    if (!prayerTime) {
      return APIError.aborted("Error creating prayer time");
    }
    return {
      success: true,
      result: prayerTime,
    };
  }
);

/**
 * Find all prayer times for a location and month
 * @returns {Promise<PrayerTimes[]>}
 */
export const prayerTimesFindLocationTime = api(
  { expose: true, method: "GET", path: "/times/find/:locationId/:year/:month" },
  async (p: { locationId: Location["id"]; year: number; month: number }) => {
    // Create start and end dates for the month
    const startDate = new Date(p.year, p.month - 1, 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(p.year, p.month, 0).toISOString().split("T")[0];

    const location = await db
      .select()
      .from(prayerTimes)
      .where(
        sql`location_id = ${p.locationId} AND date >= ${startDate} AND date <= ${endDate}`
      );

    return {
      success: true,
      result: location,
    };
  }
);

export const prayerTimesList = api(
  { expose: true, method: "GET", path: "/times" },
  async (): Promise<{ success: boolean; result: PrayerTimes[] }> => {
    const results = await db
      .select()
      .from(prayerTimes)
      .innerJoin(locations, eq(locations.id, prayerTimes.locationId));

    // Map the results to include location details under `location`
    const response = results.map((record) => {
      return {
        ...record.prayer_times, // properties from the prayer_times table
        location: {
          id: record.locations.id,
          name: record.locations.name,
          code: record.locations.code,
          description: record.locations.description,
        },
        locationId: record.prayer_times.locationId ?? 0, // ensure locationId is a number
      };
    }) as PrayerTimes[];

    return {
      success: true,
      result: response,
    };
  }
);

export const prayerTimesListByLocation = api(
  { expose: true, method: "GET", path: "/times/:locationId" },
  async (p: { locationId: Location["id"] }): Promise<{ success: boolean; result: PrayerTimes[] }> => {
    const locationsPrayerTimes = await db
      .select()
      .from(prayerTimes)
      .where(eq(prayerTimes.locationId, p.locationId))
      .innerJoin(locations, eq(locations.id, prayerTimes.locationId));

    const response = locationsPrayerTimes.map((record) => {
      return {
        ...record.prayer_times, // properties from the prayer_times table
        location: {
          id: record.locations.id,
          name: record.locations.name,
          code: record.locations.code,
          description: record.locations.description,
        },
        locationId: record.prayer_times.locationId ?? 0, // ensure locationId is a number
      };
    }) as PrayerTimes[];

    return {
      success: true,
      result: response,
    };
  }
);
