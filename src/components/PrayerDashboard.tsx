"use client";

import { useEffect, useState } from "react";
import { timetable } from "../app/client";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

  return { name: "Fajr", time: today.fajr };
}

function getTimeUntil(timeString: string): string {
  const now = new Date();
  const currentDate = new Date().toISOString().split("T")[0];
  const targetTime = new Date(`${currentDate}T${timeString}`);

  if (targetTime < now) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  const diff = targetTime.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function PrayerDashboard({
  today,
  locationName = "",
}: {
  today: timetable.PrayerTimes;
  locationName?: string;
}) {
  const [timeUntil, setTimeUntil] = useState("00:00");
  const [nextPrayer, setNextPrayer] = useState(() => getNextPrayer(today));

  useEffect(() => {
    const updateCountdown = () => {
      const next = getNextPrayer(today);
      setNextPrayer(next);
      setTimeUntil(getTimeUntil(next.time));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [today]);

  const prayers = [
    { name: "Fajr", time: today.fajr, jamat: today.fajrJamat },
    { name: "Sunrise", time: today.sunrise, jamat: null },
    { name: "Dhuhr", time: today.dhuhr, jamat: today.dhuhrJamat },
    { name: "Asr", time: today.asr, jamat: today.asrJamat },
    { name: "Maghrib", time: today.maghrib, jamat: today.maghribJamat },
    { name: "Isha", time: today.isha, jamat: today.ishaJamat },
  ];

  return (
    <div className="space-y-6">
      {/* Next Prayer Card */}
      <Card className="glass-strong">
        <CardContent className="p-8 text-center">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Next Prayer</p>
            <h2 className="text-3xl font-bold text-primary">{nextPrayer.name}</h2>
            <div className="text-4xl font-mono font-bold tracking-wider">
              {timeUntil}
            </div>
            <p className="text-sm text-muted-foreground">
              Jamat at {nextPrayer.time}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Today's Times Grid */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">
              Today&apos;s Times{locationName && ` - ${locationName}`}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {prayers.map((prayer) => (
              <div
                key={prayer.name}
                className="text-center p-4 rounded-lg glass border-border/30 hover:border-primary/30 transition-colors"
              >
                <div className="font-semibold text-sm mb-1">{prayer.name}</div>
                <div className="text-lg font-mono">{prayer.time}</div>
                {prayer.jamat && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Jamat: <span className="text-primary">{prayer.jamat}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}