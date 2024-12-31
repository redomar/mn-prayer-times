import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { processTimesData } from "../utils/dates";
import { createMonthlyICS } from "../utils/calendar";
import { timetable } from "@/app/client";

export const PrayerTimesTable = ({
  times,
}: {
  times: timetable.PrayerTimes[];
}) => {
  const timesByMonth = times.reduce(
    (acc, time) => {
      const monthYear = new Date(time.date).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(time);
      return acc;
    },
    {} as Record<string, timetable.PrayerTimes[]>,
  );

  if (times.length === 0) {
    return <div className="m-8 max-w-3xl mx-auto">Loading</div>;
  }

  return (
    <div className="m-8 max-w-3xl mx-auto">
      <div className="mb-4 min-h-20 text-center text-4xl font-bold text-[#fd116f]">
        Prayer times for {times[0]?.location?.name ?? "Unknown location"}
      </div>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {Object.entries(timesByMonth).map(([monthYear, monthTimes]) => (
          <button
            key={monthYear}
            onClick={() => createMonthlyICS(monthTimes)}
            className="bg-[#fd116f] text-white px-4 py-2 rounded-lg hover:bg-[#fd116f]/90 flex items-center gap-2 transition-colors"
          >
            <span>📅</span>
            <span>Download {monthYear} Calendar</span>
          </button>
        ))}
      </div>

      <table className="table-auto border border-[#fdbd03]/20 text-center">
        <TableHeader />
        <tbody className="divide-y divide-[#fdbd03]/20">
          {processTimesData(times).map((time) => (
            <TableRow key={time.id} time={time} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
