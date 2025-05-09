import { timetable } from "@/app/client";
import { getRowClassName, formatDate } from "../utils/dates";

export const TableRow = ({ time }: { time: timetable.PrayerTimes }) => {
  const isToday =
    new Date(time.date).toDateString() === new Date().toDateString();

  return (
    <tr
      key={time.id}
      className={`${
        isToday ? "bg-amber-500/20" : "hover:bg-purple-800/30"
      } transition-colors`}
    >
      <td className="w-full font-mono text-sm min-w-48 py-2 font-medium">
        {formatDate(time.date)}
      </td>
      <td className="py-2">{time.fajr}</td>
      <td className="py-2">{time.fajrJamat}</td>
      <td className="py-2">{time.dhuhrJamat}</td>
      <td className="py-2">{time.asrJamat}</td>
      <td className="py-2">{time.maghrib}</td>
      <td className="py-2">{time.ishaJamat}</td>
    </tr>
  );
};
