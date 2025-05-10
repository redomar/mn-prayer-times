// src/app/page.tsx (Server Component, no "use client")

import Client, { Environment, Local, timetable } from "./client";
import { PrayerTimesTable } from "@/components/PrayerTimesTable";
import { beforeNowAndSorted } from "@/utils/before";
import Link from "next/link";

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
    <main className="bg-gradient-to-b from-indigo-950 to-purple-900 min-h-screen text-amber-50">
      <div className="relative p-8">
        <h1 className="text-2xl font-medium text-amber-300 mb-4">
          Prayer Locations
        </h1>
        <ul className="flex flex-wrap gap-4">
          {data.locations.map((location) => (
            <li key={location.id} className="mb-2">
              <Link href={`/${location.name.toLowerCase()}`}>
                <button className="border border-amber-400 hover:bg-amber-400 hover:text-indigo-950 text-amber-400 py-2 px-4 rounded transition-colors font-medium shadow-md">
                  {location.name}
                </button>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <PrayerTimesTable times={upcomingTimes} />
    </main>
  );
}
