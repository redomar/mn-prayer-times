// timetable.ts
import { api, APIError, ErrCode } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { db } from "./database";
import { prayerTimes } from "./schema";
import { PrayerTimes } from "./times";
import { and, eq, sql } from "drizzle-orm";

interface TimetableParams {
  year: number;
  month: string;
}

const LONDON_API_KEY = secret("LONDON_PRAYER_TIMES_API");

async function fetchLondonPrayerTimes(year: number, month: string) {
  const url = `https://www.londonprayertimes.com/api/times/?format=json&key=${LONDON_API_KEY()}&year=${year}&month=${month}&24hours=true`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new APIError(
      ErrCode.Internal,
      `Failed to fetch prayer times: ${response.statusText}`
    );
  }

  return {
    status: response.status,
    data: await response.json(),
  };
}

export const collectFromLondon = api(
  { method: "GET", path: "/london/:year/:month" },
  async (p: TimetableParams) => {
    try {
      const result = await fetchLondonPrayerTimes(p.year, p.month);

      const times = result.data.times;

      const body = Object.keys(times).map((date) => {
        const time = times[date];
        return {
          date: date,
          locationId: 1,
          fajr: time.fajr,
          fajrJamat: time.fajr_jamat,
          dhuhr: time.dhuhr,
          dhuhrJamat: time.dhuhr_jamat,
          asr: time.asr,
          asr2: time.asr_2,
          asrJamat: time.asr_jamat,
          maghrib: time.magrib,
          maghribJamat: time.magrib_jamat,
          isha: time.isha,
          ishaJamat: time.isha_jamat,
          sunrise: time.sunrise,
        };
      });

      const savePrayerTimes = await db
        .insert(prayerTimes)
        .values(body)
        .returning();

      return {
        status: ErrCode.OK,
        body: savePrayerTimes,
      };
    } catch (error) {
      if (error instanceof APIError) {
        return {
          status: error.code,
          error: error.message,
        };
      }
      return {
        status: 500,
        error,
      };
    }
  }
);

async function fetchBirminghamPrayerTimes(month: string, year: string) {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      action: "fulltabledata",
      year: year,
      month: month,
    }),
  };

  const response = await fetch(
    "https://centralmosque.org.uk/wp-admin/admin-ajax.php",
    options
  );

  if (!response.ok) {
    throw new APIError(
      ErrCode.Internal,
      `Failed to fetch prayer times: ${response.statusText}`
    );
  }

  const data = await response.text();
  const regex = /(&nbsp;|<([^>]+)>)/gi;
  const match = data.match(/<tr[\s\S]*?<\/tr>/g);

  if (!match) {
    throw new APIError(ErrCode.Internal, "Failed to parse table rows");
  }

  const parseTime = (time: string): string => {
    if (!time) return "";
    // Remove any spaces and convert to uppercase
    time = time.replace(/\s/g, "").toUpperCase();

    // Extract hours, minutes and period
    const matches = time.match(/(\d+):?(\d+)?(AM|PM)/);
    if (!matches) return "";

    const [, hours, minutes, period] = matches;
    let hr = parseInt(hours);
    const min = minutes ? parseInt(minutes) : 0;

    // Convert to 24-hour format
    if (period === "PM" && hr < 12) hr += 12;
    if (period === "AM" && hr === 12) hr = 0;

    return `${hr.toString().padStart(2, "0")}:${min
      .toString()
      .padStart(2, "0")}`;
  };

  const parseDate = (date: string): string => {
    const cleanedDate = date.replace(/\b(\d+)(st|nd|rd|th)\b/, "$1");
    // Using the 14:00 hour to mitigate daylight savings time issues
    return (
      new Date(cleanedDate + " 14:00:00").toISOString().split("T")[0] ?? ""
    );
  };

  return match.map((tr): Partial<PrayerTimes> => {
    const tdMatch = tr.match(/<td[\s\S]*?<\/td>/g);
    if (!tdMatch) {
      throw new APIError(ErrCode.Internal, "Failed to parse table cells");
    }
    const tdArray = tdMatch.map((td) => td.replace(regex, "").trim());

    return {
      locationId: 2,
      date: parseDate(tdArray[0]),
      fajr: parseTime(tdArray[2]),
      fajrJamat: parseTime(tdArray[3]),
      sunrise: parseTime(tdArray[4]),
      dhuhr: parseTime(tdArray[6]),
      dhuhrJamat: parseTime(tdArray[7]),
      asr: parseTime(tdArray[8]), // Using asr instead of asr2 for consistency
      asr2: parseTime(tdArray[8]),
      asrJamat: parseTime(tdArray[9]),
      maghrib: parseTime(tdArray[10]),
      maghribJamat: parseTime(tdArray[11]),
      isha: parseTime(tdArray[12]),
      ishaJamat: parseTime(tdArray[13]),
    };
  });
}

export const collectFromBirmingham = api(
  { method: "GET", path: "/birmingham/:year/:month" },
  async (p: { year: string; month: string }) => {
    try {
      const birminghamPrayerTimes = (await fetchBirminghamPrayerTimes(
        p.month,
        p.year
      )) as PrayerTimes[];

      const savedPrayerTimes = await db
        .insert(prayerTimes)
        .values(birminghamPrayerTimes)
        .returning();

      return {
        status: ErrCode.OK,
        body: savedPrayerTimes,
      };
    } catch (error) {
      if (error instanceof APIError) {
        return {
          status: error.code,
          error: error.message,
        };
      }
      return {
        status: 500,
        error,
      };
    }
  }
);

export const collectFromBirminghamMonthly = api(
  { method: "GET", path: "/birmingham" },
  async () => {
    try {
      const birminghamPrayerTimes = (await fetchBirminghamPrayerTimes(
        new Date().toLocaleString("en-GB", { month: "long" }),
        new Date().getFullYear().toString()
      )) as PrayerTimes[];

      const savedPrayerTimes = await db
        .insert(prayerTimes)
        .values(birminghamPrayerTimes)
        .returning();

      return {
        status: ErrCode.OK,
        body: savedPrayerTimes,
      };
    } catch (error) {
      if (error instanceof APIError) {
        return {
          status: error.code,
          error: error.message,
        };
      }
      return {
        status: 500,
        error,
      };
    }
  }
);

async function fetchManchesterPrayerTimes(month: string, year: string) {
  const fetchData = async () => {
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        current_file: `${month} ${year}`,
        action: "mcm_get_month_file",
      }),
    };
    const response = await fetch(
      "https://manchestercentralmosque.org/wp-admin/admin-ajax.php",
      options
    );

    return response.text();
  };

  const data = await fetchData();
  const regex = /(&nbsp;|<([^>]+)>)/gi;
  const trArray = data.match(/<tr[\s\S]*?<\/tr>/g);

  if (!trArray) {
    throw new APIError(ErrCode.Internal, "Failed to parse table rows");
  }

  const parseTime = (time: string, period: string): string => {
    const [hours, minutes] = time.split(".").map(Number);
    let adjustedHours = hours;

    if (period === "AM") {
      if (hours === 12) {
        adjustedHours = 0; // Convert 12 AM to 00
      }
    } else if (period === "PM") {
      if (hours !== 12) {
        adjustedHours = hours + 12; // Convert PM hours to 24-hour format
      }
    }

    return `${adjustedHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const determinePeriod = (time: string, index: number): string => {
    if (index <= 2) return "AM"; // Fajr and Sunrise
    if (index === 3) return "AM"; // Dhuhur
    return "PM"; // Asr, Maghrib, Isha
  };

  const parseDate = (date: string): string => {
    const cleanedDate = date.replace(/\b(\d+)(st|nd|rd|th)\b/, "$1");
    return new Date(cleanedDate).toISOString().split("T")[0] ?? "";
  };

  return trArray
    .map((tr) => {
      const tdMatch = tr.match(/<td[\s\S]*?<\/td>/g);
      if (!tdMatch) {
        throw new APIError(ErrCode.Internal, "Failed to parse table cells");
      }
      return tdMatch.map((td) => td.replace(regex, ""));
    })
    .filter((td) => parseInt(td[0]) > 0)
    .map((tdArray): Partial<PrayerTimes> => {
      return {
        locationId: 3,
        date: parseDate(`${tdArray[0]} ${month} ${year}`),
        fajr: parseTime(tdArray[3], determinePeriod(tdArray[3], 0)),
        fajrJamat: parseTime(tdArray[10], determinePeriod(tdArray[10], 1)),
        sunrise: parseTime(tdArray[4], determinePeriod(tdArray[4], 2)),
        dhuhr: parseTime(tdArray[6], determinePeriod(tdArray[6], 3)),
        dhuhrJamat: parseTime(tdArray[11], determinePeriod(tdArray[11], 3)),
        asr: parseTime(tdArray[7], determinePeriod(tdArray[7], 4)),
        asr2: parseTime(tdArray[7], determinePeriod(tdArray[7], 4)),
        asrJamat: parseTime(tdArray[12], determinePeriod(tdArray[12], 4)),
        maghrib: parseTime(tdArray[8], determinePeriod(tdArray[8], 5)),
        maghribJamat: parseTime(tdArray[13], determinePeriod(tdArray[13], 5)),
        isha: parseTime(tdArray[9], determinePeriod(tdArray[9], 6)),
        ishaJamat: parseTime(tdArray[14], determinePeriod(tdArray[14], 6)),
      };
    });
}

export const collectFromManchester = api(
  { method: "GET", path: "/manchester/:month/:year" },
  async (p: { month: string; year: string }) => {
    try {
      const manchesterPrayerTimes = (await fetchManchesterPrayerTimes(
        p.month,
        p.year
      )) as PrayerTimes[];

      const savedPrayerTimes = await db
        .insert(prayerTimes)
        .values(manchesterPrayerTimes)
        .returning();

      return {
        status: ErrCode.OK,
        body: savedPrayerTimes,
      };
    } catch (error) {
      if (error instanceof APIError) {
        return {
          status: error.code,
          error: error.message,
        };
      }
      return {
        status: 500,
        error,
      };
    }
  }
);

export const dropTimesByLocationAndMonthYear = api(
  { method: "DELETE", path: "/times/location/:locationId/:year/:month" },
  async (p: { locationId: number; year: number; month: number }) => {
    const dateRangeTheYearMonthsStart = new Date(p.year, p.month - 1, 1);
    const dateRangeTheYearMonthsEnd = new Date(p.year, p.month, 0);
    try {
      await db
        .delete(prayerTimes)
        .where(
          and(
            eq(prayerTimes.locationId, p.locationId),
            sql`date >= ${dateRangeTheYearMonthsStart.toISOString()} AND date <= ${dateRangeTheYearMonthsEnd.toISOString()}`
          )
        );
      return {
        status: ErrCode.OK,
        body: null,
      };
    } catch (error) {
      if (error instanceof APIError) {
        return {
          status: error.code,
          error: error.message,
        };
      }
      return {
        status: 500,
        error,
      };
    }
  }
);
