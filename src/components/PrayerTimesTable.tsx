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

  return (
    <div className="m-8 max-w-3xl mx-auto">
      <div className="mb-4 min-h-20 text-center text-4xl font-bold text-[#fd116f]">
        Prayer times for {times[0]?.location?.name ?? "Unknown location"}
      </div>

      {/* We are still server-rendering all text, but we import a Client Component for the button */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {Object.entries(timesByMonth).map(([monthYear, monthTimes]) => (
          <DownloadCalendarButton
            key={monthYear}
            monthYear={monthYear}
            monthTimes={monthTimes}
          />
        ))}
      </div>

      <table className="table-auto border border-[#fdbd03]/20 text-center">
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
