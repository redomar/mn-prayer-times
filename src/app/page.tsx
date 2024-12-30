"use client";
import { Environment, timetable } from "./client";
import Client from "./client";
import { useEffect, useState } from "react";

const client = new Client(Environment("staging"));

const formatTimeForICS = (date: string, time: string) => {
  const [hours, minutes] = time.split(":");
  const dateObj = new Date(date);
  dateObj.setHours(parseInt(hours), parseInt(minutes));
  return dateObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

const createICSEvent = (date: string, prayerName: string, time: string) => {
  const startTime = formatTimeForICS(date, time);
  const endTime =
    new Date(
      new Date(
        startTime.slice(0, 4) +
          "-" +
          startTime.slice(4, 6) +
          "-" +
          startTime.slice(6, 8) +
          "T" +
          startTime.slice(9, 11) +
          ":" +
          startTime.slice(11, 13) +
          "Z",
      ).getTime() +
        5 * 60000,
    )
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z";

  return [
    "BEGIN:VEVENT",
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${prayerName} Prayer`,
    "END:VEVENT",
  ].join("\n");
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const downloadICS = (
  prayer: timetable.PrayerTimes,
  prayerName: string,
  time: string,
) => {
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    createICSEvent(prayer.date, prayerName, time),
    "END:VCALENDAR",
  ].join("\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${prayerName}-prayer-${prayer.date}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const createMonthlyICS = (times: timetable.PrayerTimes[]) => {
  const events = times.flatMap((prayer) => [
    createICSEvent(prayer.date, "Fajr", prayer.fajr),
    createICSEvent(prayer.date, "Dhuhr", prayer.dhuhrJamat),
    createICSEvent(prayer.date, "Asr", prayer.asrJamat),
    createICSEvent(prayer.date, "Maghrib", prayer.maghrib),
    createICSEvent(prayer.date, "Isha", prayer.ishaJamat),
  ]);

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const month = new Date(times[0].date).toLocaleString("default", {
    month: "long",
  });
  const year = new Date(times[0].date).getFullYear();
  link.download = `prayer-times-${month}-${year}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to format date
const formatDate = (date: string) => {
  if (date === "") return "";
  // today roturn today
  if (date === new Date().toISOString().split("T")[0]) return "Today";
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// Function to determine row styling
const getRowClassName = (date: string) => {
  const currentDate = new Date(date);
  const isToday = date === new Date().toISOString().split("T")[0];
  const isWeekend = currentDate.getDay() === 6 || currentDate.getDay() === 0;
  const isFirstOfMonth = currentDate.getDate() === 1;
  const isFriday = currentDate.getDay() === 5;

  if (isToday) return "bg-[#fdbd03] text-white font-bold";
  if (isWeekend) return "bg-gray-200/50 text-gray-500";
  if (isFriday) return "bg-[#fd116f] text-black";
  if (isFirstOfMonth) return "bg-black text-white";
  return "even:bg-black/5 odd:bg-black/10";
};

// Function to filter and sort times
const processTimesData = (times: timetable.PrayerTimes[]) => {
  return times
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter((time) => {
      const date = new Date(time.date);
      return date.getTime() > Date.now() - 1000 * 60 * 60 * 24;
    });
};

// Table Header Component
const TableHeader = () => (
  <thead className="bg-black text-white">
    <tr>
      <th className="px-4 py-2">Date</th>
      <th className="px-4 py-2">Fajr</th>
      <th className="px-4 py-2">Fajr Jamat</th>
      <th className="px-4 py-2">Dhuhr Jamat</th>
      <th className="px-4 py-2">Asr Jamat</th>
      <th className="px-4 py-2">Maghrib</th>
      <th className="px-4 py-2">Isha Jamat</th>
    </tr>
  </thead>
);

// Table Row Component
const TableRow = ({ time }: { time: timetable.PrayerTimes }) => (
  <tr key={time.id} className={getRowClassName(time.date)}>
    <td className="w-full font-mono text-sm min-w-48">{formatDate(time.date)}</td>
    <td>{time.fajr}</td>
    <td>{time.fajrJamat}</td>
    <td>{time.dhuhrJamat}</td>
    <td>{time.asrJamat}</td>
    <td>{time.maghrib}</td>
    <td>{time.ishaJamat}</td>
  </tr>
);

// Prayer Times Table Component

const PrayerTimesTable = ({ times }: { times: timetable.PrayerTimes[] }) => {
  // Group times by month
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

  return (
    <div className="mx-auto mb-8 max-w-xl">
      <div className="mb-4 min-h-20 text-center text-4xl font-bold text-[#fd116f]">
        Prayer times for {times[0].location?.name ?? "Unknown location"}
      </div>

      {/* Month buttons */}
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

// Main Page Component
export default function Home() {
  const [times, setTimes] = useState<timetable.PrayerTimes[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await client.timetable.prayerTimesList();
        if (response.success) {
          setTimes(response.result);
        } else {
          setError(true);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setError(true);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <div>Error</div>;
  }

  if (times.length === 0) {
    return <div>Loading...</div>;
  }

  // group times by location
  const timesByLocation = times.reduce(
    (acc, time) => {
      if (!acc[time.locationId]) {
        acc[time.locationId] = [];
      }
      acc[time.locationId].push(time);
      return acc;
    },
    {} as Record<number, timetable.PrayerTimes[]>,
  );

  return (
    <main className="mt-2">
      {/* <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"> */}
      <div className="w-full"> 
        {Object.keys(timesByLocation).map((locationId) => {
          const id = Number(locationId);
          return <PrayerTimesTable key={id} times={timesByLocation[id]} />;
        })}
      </div>
    </main>
  );
}
