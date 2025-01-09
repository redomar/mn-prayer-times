// src/app/page.tsx (Server Component, no "use client")

import Client, { Environment, Local, timetable } from "./client";
import { PrayerTimesTable } from "@/components/PrayerTimesTable";
import { beforeNowAndSorted } from "@/utils/before";
import Link from "next/link";

export const revalidate = 3600;

async function getHomeData() {
  const target = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "local";
  const client = new Client(
    target === "local" ? Local : Environment("staging"),
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
    <main className="mt-2">
      <div className="relative m-4">
        <h1>Other Locations</h1>
        <ul className="flex space-x-4">
          {data.locations.map((location) => (
            <li key={location.id} className="mb-2">
              <Link href={`/${location.name.toLowerCase()}`}>
                <button className="bg-[#fd116f] text-white py-2 px-4 rounded">
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
