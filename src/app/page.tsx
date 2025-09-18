// src/app/page.tsx (Server Component, no "use client")

import Client, { Environment, Local, timetable } from "./client";
import { PrayerTimesTableNew } from "@/components/PrayerTimesTableNew";
import { PrayerDashboard } from "@/components/PrayerDashboard";
import { beforeNowAndSorted } from "@/utils/before";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <main className="min-h-screen bg-background">
      <div className="w-full p-8 space-y-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Prayer Times</h1>
          <ThemeToggle />
        </div>

        {/* Today's Dashboard */}
        {upcomingTimes.length > 0 && (
          <PrayerDashboard today={upcomingTimes[0]} />
        )}

        {/* Location Selection */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-xl">Select Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.locations.map((location) => (
                <Link key={location.id} href={`/${location.name.toLowerCase()}`}>
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

        {/* Monthly Table */}
        <PrayerTimesTableNew times={upcomingTimes} />
      </div>
    </main>
  );
}
