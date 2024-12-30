import { timetable } from "@/app/client";
import { getRowClassName, formatDate } from "../utils/dates";

export const TableRow = ({ time }: { time: timetable.PrayerTimes }) => (
  <tr key={time.id} className={getRowClassName(time.date)}>
    <td className="font-mono text-sm min-w-48">{formatDate(time.date)}</td>
    <td>{time.fajr}</td>
    <td>{time.fajrJamat}</td>
    <td>{time.dhuhrJamat}</td>
    <td>{time.asrJamat}</td>
    <td>{time.maghrib}</td>
    <td>{time.ishaJamat}</td>
  </tr>
);
