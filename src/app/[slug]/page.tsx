// src/app/[slug]/page.tsx (Server Component, no "use client")

import Client, { Environment, Local, timetable } from "../client";
import Link from "next/link";
import { PrayerTimesTableNew } from "@/components/PrayerTimesTableNew";
import { PrayerDashboard } from "@/components/PrayerDashboard";
import { beforeNowAndSorted } from "@/utils/before";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

// Make sure to declare your revalidate
export const revalidate = 3600;

// Reusable function in server land:
async function getTimes(slug: string) {
  // We create the client in here or above.
  // Use process.env to decide which environment to use.
  const target = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "local";
  const client = new Client(
    target === "local" ? Local : Environment("staging")
  );

  // Then call your `prayerTimesListByLocation`:
  const locationsResponse = await client.timetable.locationFind();
  if (!locationsResponse.success) throw new Error("Failed to fetch locations");

  const locationData = locationsResponse.result.find(
    (loc) => loc.name.toLowerCase() === slug
  );
  if (!locationData) throw new Error(`Cannot find location ${slug}`);

  const response = await client.timetable.prayerTimesListByLocation(
    locationData.id
  );
  if (!response.success) throw new Error("Failed to fetch prayer times");

  return response.result;
}
export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  if (!params.slug) throw new Error("No slug provided");

  let upcomingTimes: timetable.PrayerTimes[];
  let today: timetable.PrayerTimes;
  let locationName: string;
  try {
    const times = await getTimes(params.slug.toLowerCase());
    upcomingTimes = beforeNowAndSorted(times, new Date());
    today = upcomingTimes[0];
    locationName = today?.location?.name ?? "Unknown location";
    console.log(today);
  } catch (error) {
    console.error(error);
    return <div>Error loading data</div>;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="w-full p-8 space-y-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" className="glass hover:glass-strong transition-all duration-300">
                ← Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">
              {locationName}
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Dashboard */}
        {today && (
          <PrayerDashboard today={today} locationName={locationName} />
        )}

        {/* Monthly Table */}
        <PrayerTimesTableNew times={upcomingTimes} />
      </div>
    </main>
  );
}
