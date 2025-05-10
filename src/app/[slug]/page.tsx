// src/app/[slug]/page.tsx (Server Component, no "use client")

import Client, { Environment, Local, timetable } from "../client";
import Link from "next/link";
import { PrayerTimesTable } from "@/components/PrayerTimesTable";
import { beforeNowAndSorted } from "@/utils/before";
import { PrayerCountdown } from "@/components/PrayerCountdown";

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
    locationName = today.location?.name ?? "Unknown location";
    console.log(today);
  } catch (error) {
    console.error(error);
    return <div>Error loading data</div>;
  }

  // After data is fetched on server, we can pass it to a client component if needed:
  return (
    <main className="bg-gradient-to-b from-indigo-950 to-purple-900 min-h-screen text-amber-50">
      <div className="w-full p-8">
        <Link href="/">
          <button className="bg-amber-500 hover:bg-amber-600 text-indigo-950 py-2 px-4 rounded mb-4 transition-colors font-medium">
            Back Home
          </button>
        </Link>
        {today && <PrayerCountdown today={today} locationName={locationName} />}
        <PrayerTimesTable times={upcomingTimes} />
      </div>
    </main>
  );
}
