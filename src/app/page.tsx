// src/app/page.tsx (Server Component, no "use client")

import { PrayerDashboard } from "@/components/PrayerDashboard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { beforeNowAndSorted } from "@/utils/before";
import Link from "next/link";
import Client, { Environment, Local, timetable } from "./client";

export const revalidate = 3600;

async function getHomeData() {
  const target = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "local";
  const client = new Client(
    target === "local" ? Local : Environment("staging")
  );

  // Get locations
  const locResp = await client.timetable.locationFind();
  if (!locResp.success) throw new Error("Failed to fetch locations");

  // Maybe default to id=1, or whatever you want for the home page
  const timesResp = await client.timetable.prayerTimesListByLocation(1);
  if (!timesResp.success) throw new Error("Failed to fetch prayer times");

  return {
    locations: locResp.result,
    times: timesResp.result,
  };
}

export default async function Home() {
  let data: { locations: timetable.Location[]; times: timetable.PrayerTimes[] };
  let upcomingTimes: timetable.PrayerTimes[] = [];
  try {
    data = await getHomeData();
    upcomingTimes = beforeNowAndSorted(data.times, new Date());
  } catch (error) {
    console.error(error);
    return <div>Error</div>;
  }

  if (!data.locations.length) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-background relative">
      <div className="w-full p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Ramadan Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary/80 mb-1 font-amiri">
              Ramadan Mubarak
            </p>
            <h1 className="text-3xl md:text-4xl font-bold font-amiri">
              <span className="greeting-text">
                {data.locations.length > 0 && data.locations[0].name}
              </span>{" "}
              Prayer Times
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Location Selection */}
        <Card className="glass-gold lantern-glow">
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
              <CardTitle className="text-xl font-amiri col-span-full">
                <span className="crescent mr-2" aria-hidden="true" />
                Select Location
              </CardTitle>
              {data.locations.map((location) => (
                <Link
                  key={location.id}
                  href={`/${location.name.toLowerCase()}`}
                >
                  <Button
                    variant="outline"
                    className="w-full glass hover:glass-strong hover:border-primary/50 transition-all duration-300"
                  >
                    {location.name}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Dashboard */}
        {upcomingTimes.length > 0 && (
          <PrayerDashboard today={upcomingTimes[0]} />
        )}
      </div>
    </main>
  );
}
