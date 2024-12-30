import { api, APIError } from "encore.dev/api";
import { locations } from "./schema";
import { db } from "./database";

export interface Location {
  id: number;
  name: string;
  code: string;
  description: string;
}

export const locationCreate = api(
  { method: "POST", path: "/locations" },
  async (data: { name: string; code: string }) => {
    const [location] = await db.insert(locations).values(data).returning();
    if (!location) {
      return APIError.aborted("Error creating location");
    }
    return {
      success: true,
      result: location,
    };
  }
);

/**
 * Find all locations
 * @returns {Promise<Location[]>}
 */
export const locationFind = api(
  { expose: true, method: "GET", path: "/locations/find" },
  async (): Promise<{ success: boolean; result: Location[] }> => {
    const location = await db.select().from(locations);
    return {
      success: true,
      result: location,
    };
  }
);

/**
 * List all locations
 * @returns {Promise<Location[]>}
 */
export const locationList = api(
  { expose: true, method: "GET", path: "/locations" },
  async () => {
    const location = await db.select().from(locations);
    return {
      success: true,
      result: location,
    };
  }
);
