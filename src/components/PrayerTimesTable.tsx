// PrayerTimesTable.server.tsx
// (No "use client" here -- it’s a Server Component)

import { timetable } from "@/app/client";
import DownloadCalendarButton from "./DownloadCalendarButton";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";

// Example: If you need to do date formatting on the server, you can do it here
function formatMonthYear(dateString: string): string {
  return new Date(dateString).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function PrayerTimesTable({
  times,
}: {
  times: timetable.PrayerTimes[];
}) {
  if (times.length === 0) {
    return <div className="m-8 max-w-3xl mx-auto">No data</div>;
  }

  // Group them by month-year on the *server*
  const timesByMonth: Record<string, timetable.PrayerTimes[]> = {};
  for (const t of times) {
    const key = formatMonthYear(t.date);
    timesByMonth[key] = timesByMonth[key] || [];
    timesByMonth[key].push(t);
  }

  // In PrayerTimesTable.tsx
  return (
    <div className="max-w-7xl mx-auto px-4"> {/* increased from max-w-3xl */}
      <div className="mb-4 min-h-20 text-center text-4xl font-bold text-[#fd116f]">
        Prayer times for <span className="text-[#fdbd03] mt-10">{times[0]?.location?.name ?? "Unknown location"}</span>
      </div>
  
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {Object.entries(timesByMonth).map(([monthYear, monthTimes]) => (
          <DownloadCalendarButton
            key={monthYear}
            monthYear={monthYear}
            monthTimes={monthTimes}
          />
        ))}
      </div>
  
      <table className="w-full table-auto border-2 border-[#fdbd03] text-center"> {/* made table full width and border yellow */}
        <TableHeader />
        <tbody className="divide-y divide-[#fdbd03]/20">
          {times.map((time) => (
            <TableRow key={time.id} time={time} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
