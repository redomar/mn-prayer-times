import { timetable } from "./client";
import Client, { Local } from "./client";

const client = new Client(Local);

// Function to format date
const formatDate = (date: string) => {
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

  if (isToday) return "bg-blue-600 font-bold";
  if (isWeekend) return "bg-red-500/5 text-gray-400";
  if (isFirstOfMonth) return "bg-green-400/60 text-black";
  return "even:bg-red-900/40 odd:bg-red-900/50";
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
  <thead>
    <tr>
      <th>Date</th>
      <th>Fajr</th>
      <th>Fajr Jamat</th>
      <th>Dhuhr Jamat</th>
      <th>Asr Jamat</th>
      <th>Maghrib</th>
      <th>Isha Jamat</th>
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
const PrayerTimesTable = ({ times }: { times: timetable.PrayerTimes[] }) => (
  <>
    <div className="text-center text-4xl">
      Prayer times for {times[0].location?.name ?? "Unknown location"}
    </div>
    <table className="table-auto max-w-3xl w-full text-center mx-auto bg-black">
      <TableHeader />
      <tbody className="divide-y divide-gray-400">
        {processTimesData(times).map((time) => (
          <TableRow key={time.id} time={time} />
        ))}
      </tbody>
    </table>
  </>
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
