// timetable.ts
import { api, APIError, ErrCode } from "encore.dev/api";
import { secret } from "encore.dev/config";

interface TimetableLondonParams {
  year: number;
  month: string;
}

interface TimetableLondonResponse {
  status: number | ErrCode;
  body?: {
    city: string;
    times: {
      [key: string]: {
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
    };
  };
  error?: string;
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

export const getLondonPrayerTimes = api(
  { method: "GET", path: "/london/:year/:month" },
  async (p: TimetableLondonParams): Promise<TimetableLondonResponse> => {
    try {
      const result = await fetchLondonPrayerTimes(p.year, p.month);

      return {
        status: ErrCode.OK, // or just 200
        body: result.data,
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
        error: "Internal server error",
      };
    }
  }
);
