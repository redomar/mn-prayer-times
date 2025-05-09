"use client";

import { timetable } from "@/app/client";
import { createMonthlyICS } from "../utils/calendar";
import { Calendar } from "lucide-react";

export default function DownloadCalendarButton({
  monthYear,
  monthTimes,
}: {
  monthYear: string;
  monthTimes: timetable.PrayerTimes[];
}) {
  // The ICS generation code (or other interactive logic) can happen in the client
  const handleDownload = () => {
    createMonthlyICS(monthTimes);
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-gradient-to-r from-amber-500 to-amber-600 text-indigo-950 px-4 py-2 rounded-lg hover:from-amber-600 hover:to-amber-700 flex items-center gap-2 transition-all font-medium shadow-md"
    >
      <Calendar className="w-5 h-5" />
      <span>Download {monthYear}</span>
    </button>
  );
}
