"use client";

import { useEffect, useState } from "react";
import { timetable } from "../app/client";
import {
  Sun,
  Sunrise,
  Moon,
  Cloud,
  CloudSun,
  Calendar,
  MoonStar,
  Menu,
  X,
  ChevronRight,
  Home,
  MapPin,
  Settings,
  Info,
  Clock,
} from "lucide-react";
import Link from "next/link";

function getNextPrayer(today: timetable.PrayerTimes): {
  name: string;
  time: string;
} {
  const now = new Date();
  const prayers = [
    { name: "Fajr", time: today.fajrJamat },
    { name: "Dhuhr", time: today.dhuhrJamat },
    { name: "Asr", time: today.asrJamat },
    { name: "Maghrib", time: today.maghribJamat },
    { name: "Isha", time: today.ishaJamat },
  ];

  const currentDate = new Date().toISOString().split("T")[0];

  for (const prayer of prayers) {
    const prayerTime = new Date(`${currentDate}T${prayer.time}`);
    if (prayerTime > now) {
      return prayer;
    }
  }

  // If no prayer times are left today, return Fajr
  return { name: "Fajr", time: today.fajr };
}

function getTimeUntil(timeString: string): string {
  const now = new Date();
  const currentDate = new Date().toISOString().split("T")[0];
  const targetTime = new Date(`${currentDate}T${timeString}`);

  if (targetTime < now) {
    // Add 24 hours if the prayer time has passed
    targetTime.setDate(targetTime.getDate() + 1);
  }

  const diff = targetTime.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function PrayerCountdown({
  today,
  locations = [],
  locationName = "",
}: {
  today: timetable.PrayerTimes;
  locations?: { id: number; name: string }[];
  locationName?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [timeUntil, setTimeUntil] = useState("00:00:00");
  const [nextPrayer, setNextPrayer] = useState(() => getNextPrayer(today));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    const next = getNextPrayer(today);
    setNextPrayer(next);
    setTimeUntil(getTimeUntil(next.time));
    setIsLoading(false);

    const interval = setInterval(() => {
      const next = getNextPrayer(today);
      setNextPrayer(next);
      setTimeUntil(getTimeUntil(next.time));
    }, 1000);

    return () => clearInterval(interval);
  }, [today]);

  useEffect(() => {
    // Format date on client side only
    setFormattedDate(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-indigo-900 to-purple-900 p-4 rounded-lg shadow-lg border border-amber-400/20">
        <div className="flex items-center gap-2">
          <MoonStar className="w-7 h-7 text-amber-300" />
          <h1 className="text-2xl font-bold text-amber-100">
            Prayer Times {locationName && "for " + locationName}
          </h1>
        </div>
        <button
          onClick={toggleMenu}
          className="p-2 rounded-full bg-indigo-800 hover:bg-amber-400/20 transition-colors"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-amber-300" />
          ) : (
            <Menu className="w-6 h-6 text-amber-300" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed inset-0 z-50 transform ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={toggleMenu}
        ></div>
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-b from-indigo-950 to-purple-900 p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-amber-300">Menu</h2>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-full hover:bg-indigo-800 transition-colors"
            >
              <X className="w-5 h-5 text-amber-300" />
            </button>
          </div>

          <nav className="space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 p-3 rounded-md hover:bg-indigo-800 text-amber-100 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>

            {locations && locations.length > 0 && (
              <div className="mt-4 border-t border-indigo-700 pt-4">
                <div className="flex items-center text-sm text-amber-300 px-3 mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Locations</span>
                </div>
                {locations.map((location) => (
                  <Link
                    key={location.id}
                    href={`/${location.name.toLowerCase()}`}
                    className="flex items-center gap-3 p-2 pl-6 rounded-md hover:bg-indigo-800 text-amber-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>{location.name}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 border-t border-indigo-700 pt-4">
              <Link
                href="/settings"
                className="flex items-center gap-3 p-3 rounded-md hover:bg-indigo-800 text-amber-100 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
              <Link
                href="/about"
                className="flex items-center gap-3 p-3 rounded-md hover:bg-indigo-800 text-amber-100 transition-colors"
              >
                <Info className="w-5 h-5" />
                <span>About</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Date Display */}
      <div className="flex items-center gap-3 text-amber-300 mb-6">
        <Calendar className="w-6 h-6" />
        <span className="text-xl font-medium">{formattedDate}</span>
      </div>

      {/* Next Prayer Countdown */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-amber-50 p-8 sm:p-10 rounded-xl mb-8 text-center border-2 border-amber-400/70 shadow-lg">
        <h2 className="text-2xl sm:text-3xl mb-4 font-semibold">
          Next Prayer: <span className="text-amber-300">{nextPrayer.name}</span>
        </h2>
        {isLoading ? (
          <div className="h-[92px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-300 border-t-transparent"></div>
          </div>
        ) : (
          <div className="font-mono text-5xl sm:text-7xl md:text-8xl font-bold text-amber-200 tracking-wider">
            {timeUntil}
          </div>
        )}
        <div className="text-xl sm:text-2xl mt-6 font-medium">
          Time remaining until {nextPrayer.name} at{" "}
          <span className="text-amber-300 font-semibold">
            {nextPrayer.time}
          </span>
        </div>
      </div>

      {/* Prayer Times Grid */}
      <h3 className="text-xl font-medium text-amber-200 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        Today&apos;s Prayer Schedule
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-purple-800 to-indigo-900 text-amber-50 p-4 rounded-lg text-center border border-purple-700 hover:border-amber-400 transition-all shadow-md">
          <Moon className="w-8 h-8 mx-auto mb-3 text-amber-300" />
          <div className="font-bold text-lg mb-1">Fajr</div>
          <div className="text-xl text-amber-200 mb-1">{today.fajr}</div>
          <div className="text-sm font-medium bg-indigo-800/50 py-1 px-2 rounded-full inline-block">
            Jamaat: <span className="text-amber-300">{today.fajrJamat}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-800 to-indigo-900 text-amber-50 p-4 rounded-lg text-center border border-purple-700 hover:border-amber-400 transition-all shadow-md">
          <Sunrise className="w-8 h-8 mx-auto mb-3 text-amber-300" />
          <div className="font-bold text-lg mb-1">Sunrise</div>
          <div className="text-xl text-amber-200">{today.sunrise}</div>
          <div className="text-sm opacity-0">-</div>
        </div>

        {/* Repeat similar styling improvements for other prayers */}
        <div className="bg-gradient-to-br from-purple-800 to-indigo-900 text-amber-50 p-4 rounded-lg text-center border border-purple-700 hover:border-amber-400 transition-all shadow-md">
          <Sun className="w-8 h-8 mx-auto mb-3 text-amber-300" />
          <div className="font-bold text-lg mb-1">Dhuhr</div>
          <div className="text-xl text-amber-200 mb-1">{today.dhuhr}</div>
          <div className="text-sm font-medium bg-indigo-800/50 py-1 px-2 rounded-full inline-block">
            Jamaat: <span className="text-amber-300">{today.dhuhrJamat}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-800 to-indigo-900 text-amber-50 p-4 rounded-lg text-center border border-purple-700 hover:border-amber-400 transition-all shadow-md">
          <CloudSun className="w-8 h-8 mx-auto mb-3 text-amber-300" />
          <div className="font-bold text-lg mb-1">Asr</div>
          <div className="text-xl text-amber-200 mb-1">{today.asr}</div>
          <div className="text-sm font-medium bg-indigo-800/50 py-1 px-2 rounded-full inline-block">
            Jamaat: <span className="text-amber-300">{today.asrJamat}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-800 to-indigo-900 text-amber-50 p-4 rounded-lg text-center border border-purple-700 hover:border-amber-400 transition-all shadow-md">
          <Sunrise className="w-8 h-8 mx-auto mb-3 rotate-180 text-amber-300" />
          <div className="font-bold text-lg mb-1">Maghrib</div>
          <div className="text-xl text-amber-200 mb-1">{today.maghrib}</div>
          <div className="text-sm font-medium bg-indigo-800/50 py-1 px-2 rounded-full inline-block">
            Jamaat: <span className="text-amber-300">{today.maghribJamat}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-800 to-indigo-900 text-amber-50 p-4 rounded-lg text-center border border-purple-700 hover:border-amber-400 transition-all shadow-md">
          <Cloud className="w-8 h-8 mx-auto mb-3 text-amber-300" />
          <div className="font-bold text-lg mb-1">Isha</div>
          <div className="text-xl text-amber-200 mb-1">{today.isha}</div>
          <div className="text-sm font-medium bg-indigo-800/50 py-1 px-2 rounded-full inline-block">
            Jamaat: <span className="text-amber-300">{today.ishaJamat}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
