// timetable.ts
import { and, eq, sql } from "drizzle-orm";
import { api, APIError, ErrCode } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { db } from "./database";
import { prayerTimes } from "./schema"; // Removed NewPrayerTime import
import { PrayerTimes } from "./times";

const LONDON_API_KEY = secret("LONDON_PRAYER_TIMES_API");

// --- Helper Functions ---

/**
 * Cleans an HTML string by removing HTML entities like &nbsp; and tags.
 * @param html The HTML string to clean.
 * @returns The cleaned text string.
 */
const cleanHtmlString = (html: string): string => {
  const regex = /(&nbsp;|<([^>]+)>)/gi;
  return html.replace(regex, "").trim();
};

/**
 * Fetches HTML data from a specified URL using the POST method.
 * @param url The URL to fetch data from.
 * @param bodyParams An object рекорд of parameters to send in the request body.
 * @returns A promise that resolves to the HTML data as a string.
 * @throws {APIError} If the fetch operation fails or the response is not ok.
 */
async function fetchHtmlViaPost(
  url: string,
  bodyParams: Record<string, string>
): Promise<string> {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(bodyParams),
  };
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new APIError(
      ErrCode.Internal,
      `Failed to fetch data from ${url}: ${response.statusText}`
    );
  }
  return response.text();
}

/**
 * Extracts table row (<tr>) elements from an HTML string.
 * @param htmlData The HTML string containing table data.
 * @returns An array of strings, where each string is an HTML <tr> element. Returns an empty array if no rows are found.
 */
function extractTableRows(htmlData: string): string[] {
  const match = htmlData.match(/<tr[\s\S]*?<\/tr>/g);
  return match || [];
}

/**
 * Extracts and cleans table cell (<td>) content from an HTML table row string.
 * @param rowHtml The HTML string for a single table row (<tr>).
 * @returns An array of cleaned text content from each <td> in the row.
 * @throws {APIError} If parsing table cells fails.
 */
function extractAndCleanTableCells(rowHtml: string): string[] {
  const cellMatch = rowHtml.match(/<td[\s\S]*?<\/td>/g);
  if (!cellMatch) {
    throw new APIError(
      ErrCode.Internal,
      "Failed to parse table cells from a row"
    );
  }
  return cellMatch.map(cleanHtmlString);
}

/**
 * Gets the current date's long month name, short month name, 3-char month name, numeric year, and string year.
 * @returns An object containing longMonth, shortMonth, shortMonth3Char, numericYear, and year (string).
 */
function getCurrentDateParts() {
  const now = new Date();
  const shortMonth = now.toLocaleString("en-GB", { month: "short" });
  return {
    longMonth: now.toLocaleString("en-GB", { month: "long" }),
    shortMonth: shortMonth,
    shortMonth3Char: shortMonth.slice(0, 3), // Convert 4-char to 3-char (e.g., "Sept" -> "Sep")
    numericYear: now.getFullYear(),
    year: now.getFullYear().toString(),
  };
}

/**
 * Inserts prayer times into the database.
 * @param timesToSave An array of PrayerTimes objects (or partial objects) to save.
 * @returns A promise that resolves to the saved prayer times records.
 */
async function saveAndReturnPrayerTimes(
  timesToSave: (typeof prayerTimes.$inferInsert)[]
) {
  // Use inferred insert type
  if (!timesToSave || timesToSave.length === 0) {
    return [];
  }
  return db.insert(prayerTimes).values(timesToSave).returning();
}

/**
 * Creates a standardized success response object for API endpoints.
 * @param body The data to include in the response body.
 * @returns An API response object indicating success.
 */
function apiSuccessResponse(body: unknown) {
  // Changed from any to unknown
  return { status: ErrCode.OK, body };
}

/**
 * Creates a standardized error response object for API endpoints.
 * Logs the actual error server-side for debugging.
 * @param error The error object.
 * @returns An API response object indicating an error.
 */
function apiErrorResponse(error: unknown) {
  // Changed from any to unknown
  if (error instanceof APIError) {
    return { status: error.code, error: error.message };
  }
  console.error("Unhandled API error:", error); // Log unexpected errors
  return { status: ErrCode.Internal, error: "An unexpected error occurred." };
}

/**
 * Fetches prayer data using a provided fetch function, with a retry mechanism
 * for long and short month names.
 * @param fetchFunction The core function to fetch prayer times, taking (month, year).
 * @param longMonth The full name of the month (e.g., "January").
 * @param shortMonth The abbreviated name of the month (e.g., "Jan").
 * @param year The year as a string.
 * @param locationName A descriptive name of the location for error messages.
 * @returns A promise that resolves to an array of PrayerTimes.
 * @throws {APIError} If fetching fails after retries or data is insufficient.
 */
async function fetchPrayerDataWithRetry(
  fetchFunction: (month: string, year: string) => Promise<PrayerTimes[]>,
  longMonth: string,
  shortMonth: string,
  shortMonth3Char: string,
  year: string,
  locationName: string
): Promise<PrayerTimes[]> {
  let data: PrayerTimes[] | null = null;

  // First attempt: try with long month name (e.g., "September")
  try {
    data = await fetchFunction(longMonth, year);
  } catch (e) {
    console.warn(
      `Failed fetching ${locationName} with long month name ('${longMonth}'), trying short ('${shortMonth}'). Error: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }

  // Second attempt: try with short month name (e.g., "Sept")
  if (!data || data.length === 0) {
    try {
      data = await fetchFunction(shortMonth, year);
    } catch (e) {
      console.warn(
        `Failed fetching ${locationName} with short month name ('${shortMonth}'), trying 3-char month ('${shortMonth3Char}'). Error: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  }

  // Third attempt: try with 3-character month name (e.g., "Sep")
  if (!data || data.length === 0) {
    try {
      data = await fetchFunction(shortMonth3Char, year);
    } catch (error) {
      console.error(
        `Failed to fetch ${locationName} prayer times with 3-char month ('${shortMonth3Char}'): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw new APIError(
        ErrCode.Internal,
        `Failed to fetch ${locationName} prayer times (long, short & 3-char month attempts failed)`
      );
    }
  }

  if (!data || data.length === 0) {
    throw new APIError(
      ErrCode.Internal,
      `${locationName} prayer times data is incomplete or empty after all attempts`
    );
  }
  return data;
}

// --- London Specific ---

async function fetchLondonPrayerTimes(year: number, month: string) {
  const url = `https://www.londonprayertimes.com/api/times/?format=json&key=${LONDON_API_KEY()}&year=${year}&month=${month}&24hours=true`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new APIError(
      ErrCode.Internal,
      `Failed to fetch London prayer times: ${response.statusText}`
    );
  }

  const unwrappedData = await response.json();

  if (
    !unwrappedData?.times ||
    typeof unwrappedData.times !== "object" ||
    Object.keys(unwrappedData.times).length === 0
  ) {
    console.log(
      "No London prayer times data found in API response for",
      year,
      month
    );
    throw new APIError(
      ErrCode.Internal,
      "No London prayer times data found or data is empty"
    );
  }

  return {
    data: unwrappedData, // Contains the .times object { "YYYY-MM-DD": {fajr: "HH:MM", ...} }
  };
}

export const collectFromLondon = api(
  { method: "GET", path: "/collect/london" },
  async () => {
    try {
      const { longMonth, numericYear } = getCurrentDateParts();
      const result = await fetchLondonPrayerTimes(numericYear, longMonth);
      const times = result.data.times;

      const body: (typeof prayerTimes.$inferInsert)[] = Object.keys(times).map(
        (date) => {
          // Use inferred insert type
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
            maghrib: time.magrib, // Note: source uses 'magrib'
            maghribJamat: time.magrib_jamat,
            isha: time.isha,
            ishaJamat: time.isha_jamat,
            sunrise: time.sunrise,
          };
        }
      );

      const savedPrayerTimes = await saveAndReturnPrayerTimes(body);
      return apiSuccessResponse(savedPrayerTimes);
    } catch (error) {
      return apiErrorResponse(error);
    }
  }
);

// --- Birmingham Specific ---

async function fetchBirminghamPrayerTimes(
  month: string, // Full month name, e.g., "July"
  year: string // Year as string, e.g., "2024"
): Promise<PrayerTimes[]> {
  const htmlData = await fetchHtmlViaPost(
    "https://centralmosque.org.uk/wp-admin/admin-ajax.php",
    { action: "fulltabledata", year, month }
  );

  const tableRowsHtml = extractTableRows(htmlData);
  // Birmingham source returns an extra header row, so expect more than 1 row for data.
  if (tableRowsHtml.length <= 1) {
    throw new APIError(
      ErrCode.Internal,
      "Failed to parse table rows or insufficient data for Birmingham"
    );
  }

  const parseTime = (timeStr: string): string => {
    if (!timeStr) return "";
    const cleanedTime = timeStr.replace(/\s/g, "").toUpperCase();
    const matches = cleanedTime.match(/(\d+):?(\d+)?(AM|PM)/);
    if (!matches) return ""; // Return empty if format is unexpected

    const [, hours, minutes, period] = matches;
    let hr = parseInt(hours);
    const min = minutes ? parseInt(minutes) : 0;

    if (period === "PM" && hr < 12) hr += 12;
    if (period === "AM" && hr === 12) hr = 0; // Midnight case (12 AM is 00 hours)

    return `${hr.toString().padStart(2, "0")}:${min
      .toString()
      .padStart(2, "0")}`;
  };

  const parseDate = (
    dayOfMonthStr: string,
    currentMonth: string,
    currentYear: string
  ): string => {
    // dayOfMonthStr is like "1", "2", "1st", "2nd" from the table's first column
    const cleanedDay = dayOfMonthStr.replace(/\b(\d+)(st|nd|rd|th)\b/, "$1");
    const dateStr = `${cleanedDay} ${currentMonth} ${currentYear}`;
    // Using GMT and a fixed time to ensure consistent date parsing across environments
    return (
      new Date(`${dateStr} 12:00:00 GMT`).toISOString().split("T")[0] ?? ""
    );
  };

  // Skip the first row if it's a header row, common in HTML tables
  // The original check was `match.length <= 1`, implying data starts from the second row.
  // Let's assume the first row is headers and skip it.
  return tableRowsHtml
    .slice(1)
    .map((rowHtml): Partial<PrayerTimes> => {
      const tdArray = extractAndCleanTableCells(rowHtml);
      // Expected tdArray structure for Birmingham Central Mosque:
      // [0] Day (e.g., "1"), [1] Date (e.g., "Fri 01 July"), [2] Fajr, [3] Fajr Jamaat, [4] Sunrise,
      // [5] Zawal, [6] Dhuhr, [7] Dhuhr Jamaat, [8] Asr, [9] Asr Jamaat,
      // [10] Maghrib, [11] Maghrib Jamaat, [12] Isha, [13] Isha Jamaat
      if (tdArray.length < 14) {
        // Handle rows that don't have enough cells, possibly log or skip
        console.warn("Skipping malformed row for Birmingham:", tdArray);
        return {}; // Return an empty object, will be filtered out or handled by DB constraints
      }

      return {
        locationId: 2,
        date: parseDate(tdArray[0], month, year), // Use month and year from function args
        fajr: parseTime(tdArray[2]),
        fajrJamat: parseTime(tdArray[3]),
        sunrise: parseTime(tdArray[4]),
        dhuhr: parseTime(tdArray[6]),
        dhuhrJamat: parseTime(tdArray[7]),
        asr: parseTime(tdArray[8]),
        asr2: parseTime(tdArray[8]), // Assuming Asr Mithl 2 is same as Asr Mithl 1
        asrJamat: parseTime(tdArray[9]),
        maghrib: parseTime(tdArray[10]),
        maghribJamat: parseTime(tdArray[11]),
        isha: parseTime(tdArray[12]),
        ishaJamat: parseTime(tdArray[13]),
      };
    })
    .filter((pt) => pt.date) as PrayerTimes[]; // Filter out any empty objects from malformed rows
}

export const collectFromBirmingham = api(
  { method: "GET", path: "/collect/birmingham" },
  async () => {
    try {
      const { longMonth, shortMonth, shortMonth3Char, year } =
        getCurrentDateParts();
      const birminghamPrayerTimesData = await fetchPrayerDataWithRetry(
        fetchBirminghamPrayerTimes,
        longMonth,
        shortMonth,
        shortMonth3Char,
        year,
        "Birmingham"
      );
      // Ensure birminghamPrayerTimesData conforms to the insert type before saving
      const validBirminghamPrayerTimes: (typeof prayerTimes.$inferInsert)[] =
        birminghamPrayerTimesData.map((pt) => ({
          ...pt,
          locationId: 2, // ensure locationId is set if not already
          // Add any other transformations or default values needed for the insert type
        }));
      const savedPrayerTimes = await saveAndReturnPrayerTimes(
        validBirminghamPrayerTimes
      );
      return apiSuccessResponse(savedPrayerTimes);
    } catch (error) {
      return apiErrorResponse(error);
    }
  }
);

// --- Manchester Specific ---

async function fetchManchesterPrayerTimesFor(
  month: string, // Full month name, e.g., "January"
  year: string // Year as string, e.g., "2024"
): Promise<PrayerTimes[]> {
  const htmlData = await fetchHtmlViaPost(
    "https://manchestercentralmosque.org/wp-admin/admin-ajax.php",
    { current_file: `${month} ${year}`, action: "mcm_get_month_file" }
  );

  const tableRowsHtml = extractTableRows(htmlData);
  // Manchester source also has header rows, data rows are identified by first cell being a number.
  if (tableRowsHtml.length <= 1) {
    // Basic check for at least one potential data row + header
    throw new APIError(
      ErrCode.Internal,
      "Failed to parse table rows or insufficient data for Manchester"
    );
  }

  const parseTimeForManchester = (timeStr: string, period: string): string => {
    if (!timeStr || !timeStr.includes(".")) return "";
    const parts = timeStr.split(".");
    if (parts.length !== 2) return "";

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return "";

    let adjustedHours = hours;
    if (period === "AM" && hours === 12) adjustedHours = 0; // Midnight
    else if (period === "PM" && hours !== 12) adjustedHours += 12; // Afternoon/evening (12 PM is 12:00)
    // For 12 PM (e.g., 12.30 PM Dhuhr), adjustedHours remains 12.

    return `${adjustedHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const determinePeriodForManchester = (prayerIndex: number): string => {
    // Prayer indices for mapping:
    // 0: Fajr, 1: Fajr Jama'ah, 2: Sunrise -> AM
    // 3: Dhuhr, 4: Asr, 5: Maghrib, 6: Isha (and their Jama'ahs) -> PM
    if (prayerIndex <= 2) return "AM";
    return "PM";
  };

  const parseDateForManchester = (
    dayOfMonth: string,
    currentMonth: string,
    currentYear: string
  ): string => {
    // dayOfMonth is like "1", "2"
    // currentMonth is "January", currentYear is "2024"
    const dateStr = `${dayOfMonth} ${currentMonth} ${currentYear}`;
    return (
      new Date(`${dateStr} 12:00:00 GMT`).toISOString().split("T")[0] ?? ""
    );
  };

  return tableRowsHtml
    .map(extractAndCleanTableCells)
    .filter(
      (tdArray) =>
        tdArray.length > 0 &&
        !isNaN(parseInt(tdArray[0])) &&
        parseInt(tdArray[0]) > 0
    ) // Valid data rows start with a day number
    .map((tdArray): Partial<PrayerTimes> => {
      // Manchester Central Mosque (Makki Masjid) tdArray structure:
      // [0] Day (e.g., "1"), [1] Date (e.g., "MONDAY"), [2] Month (e.g., "JANUARY")
      // [3] Fajr Begaan, [4] Sunrise, [5] Zawal, [6] Dhuhr Begaan, [7] Asr Begaan (Mithl 1)
      // [8] Sunset / Maghrib Begaan, [9] Isha Begaan
      // [10] Fajr Jamaat, [11] Dhuhr Jamaat, [12] Asr Jamaat, [13] Maghrib Jamaat, [14] Isha Jamaat
      // [15] Notes (optional)
      if (tdArray.length < 15) {
        console.warn("Skipping malformed row for Manchester:", tdArray);
        return {};
      }

      const dayStr = tdArray[0];

      return {
        locationId: 3,
        date: parseDateForManchester(dayStr, month, year),
        fajr: parseTimeForManchester(
          tdArray[3],
          determinePeriodForManchester(0)
        ),
        fajrJamat: parseTimeForManchester(
          tdArray[10],
          determinePeriodForManchester(1)
        ),
        sunrise: parseTimeForManchester(
          tdArray[4],
          determinePeriodForManchester(2)
        ),
        dhuhr: parseTimeForManchester(
          tdArray[6],
          determinePeriodForManchester(3)
        ),
        dhuhrJamat: parseTimeForManchester(
          tdArray[11],
          determinePeriodForManchester(3)
        ),
        asr: parseTimeForManchester(
          tdArray[7],
          determinePeriodForManchester(4)
        ),
        asr2: parseTimeForManchester(
          tdArray[7],
          determinePeriodForManchester(4)
        ), // Assuming Asr2 is same as Asr1
        asrJamat: parseTimeForManchester(
          tdArray[12],
          determinePeriodForManchester(4)
        ),
        maghrib: parseTimeForManchester(
          tdArray[8],
          determinePeriodForManchester(5)
        ),
        maghribJamat: parseTimeForManchester(
          tdArray[13],
          determinePeriodForManchester(5)
        ),
        isha: parseTimeForManchester(
          tdArray[9],
          determinePeriodForManchester(6)
        ),
        ishaJamat: parseTimeForManchester(
          tdArray[14],
          determinePeriodForManchester(6)
        ),
      };
    })
    .filter((pt) => pt.date) as PrayerTimes[];
}

export const collectFromManchester = api(
  { method: "GET", path: "/collect/manchester" },
  async () => {
    try {
      const { longMonth, shortMonth, shortMonth3Char, year } =
        getCurrentDateParts();
      const manchesterPrayerTimesData = await fetchPrayerDataWithRetry(
        fetchManchesterPrayerTimesFor,
        longMonth,
        shortMonth,
        shortMonth3Char,
        year,
        "Manchester"
      );
      // Ensure manchesterPrayerTimesData conforms to the insert type before saving
      const validManchesterPrayerTimes: (typeof prayerTimes.$inferInsert)[] =
        manchesterPrayerTimesData.map((pt) => ({
          ...pt,
          locationId: 3, // ensure locationId is set if not already
          // Add any other transformations or default values needed for the insert type
        }));
      const savedPrayerTimes = await saveAndReturnPrayerTimes(
        validManchesterPrayerTimes
      );
      return apiSuccessResponse(savedPrayerTimes);
    } catch (error) {
      return apiErrorResponse(error);
    }
  }
);

export const retryManchesterCollection = api(
  { method: "POST", path: "/retry/manchester" },
  async () => {
    const today = new Date();

    // Check: is this the first Friday of the month?
    const day = today.getDate();
    const weekday = today.getDay(); // 5 = Friday

    if (weekday === 5 && day <= 7) {
      // Assuming collectFromManchester now returns a structure compatible
      // with what an API endpoint handler should return,
      // or we adapt its response here.
      // For simplicity, let's assume collectFromManchester() itself
      // can be directly returned or its result processed by apiSuccessResponse/apiErrorResponse.
      try {
        const result = await collectFromManchester();
        // If collectFromManchester already returns an Encore-compatible response:
        return result;
        // Or, if it returns data that needs to be wrapped:
        // return apiSuccessResponse(result);
      } catch (error) {
        return apiErrorResponse(error);
      }
    }

    return {
      status: 204, // Using 204 No Content as it's a success but no specific entity to return
      body: "Not the first Friday — skipping retry",
    };
  }
);

// --- Existing Unchanged Endpoints ---
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
      return apiSuccessResponse(null); // Use helper for consistency
    } catch (error) {
      return apiErrorResponse(error); // Use helper for consistency
    }
  }
);
