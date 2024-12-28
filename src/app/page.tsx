import { timetable } from "./client";
import Client, { Local } from "./client";

const client = new Client(Local);

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
    <td className="font-mono">{formatDate(time.date)}</td>
    <td>{time.fajr}</td>
    <td>{time.fajrJamat}</td>
    <td>{time.dhuhrJamat}</td>
    <td>{time.asrJamat}</td>
    <td>{time.maghrib}</td>
    <td>{time.ishaJamat}</td>
  </tr>
);

// Prayer Times Table Component

// Update the PrayerTimesTable component
const PrayerTimesTable = ({ times }: { times: timetable.PrayerTimes[] }) => (
  <div className="mb-8">
    <div className="text-center text-4xl font-bold text-[#fd116f] mb-4">
      Prayer times for {times[0].location?.name ?? "Unknown location"}
    </div>
    <table className="table-auto max-w-4xl w-full text-center mx-auto border border-[#fdbd03]/20">
      <TableHeader />
      <tbody className="divide-y divide-[#fdbd03]/20">
        {processTimesData(times).map((time) => (
          <TableRow key={time.id} time={time} />
        ))}
      </tbody>
    </table>
  </div>
);

// Main Page Component
export default async function Home() {
  const times = await client.timetable.prayerTimesList();

  if (times.success === false) {
    return <div>Error</div>;
  }

  // group times by location
  const timesByLocation = times.result.reduce((acc, time) => {
    if (!acc[time.locationId]) {
      acc[time.locationId] = [];
    }
    acc[time.locationId].push(time);
    return acc;
  }, {} as Record<number, timetable.PrayerTimes[]>);

  return (
    <main>
      <div>
        {Object.keys(timesByLocation).map((locationId) => {
          const id = Number(locationId);
          return <PrayerTimesTable key={id} times={timesByLocation[id]} />;
        })}
      </div>
    </main>
  );
}
