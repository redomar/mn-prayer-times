"use client"; // This file is a Client Component so we can have onClick

import { timetable } from "@/app/client";
import { createMonthlyICS } from "../utils/calendar";

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
      className="bg-[#fd116f] text-white px-4 py-2 rounded-lg hover:bg-[#fd116f]/90 flex items-center gap-2 transition-colors"
    >
      <span>📅</span>
      <span>Download {monthYear} Calendar</span>
    </button>
  );
}
