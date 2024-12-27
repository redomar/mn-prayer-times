import { api } from "encore.dev/api";
import { locations } from "./schema";
import { db } from "./database";

export const findLocations = api(
  { method: "GET", path: "/locations/find" },
  async () => {
    const location = await db.select().from(locations);
    return {
      success: true,
      result: location,
    };
  }
);
