// src/app/[slug]/page.tsx (Server Component, no "use client")

import Client, { Environment, Local, timetable } from "../client";
import Link from "next/link";
import { PrayerTimesTable } from "@/components/PrayerTimesTable";
import { beforeNowAndSorted } from "@/utils/before";

// Make sure to declare your revalidate
export const revalidate = 3600;

// Reusable function in server land:
async function getTimes(slug: string) {
  // We create the client in here or above.
  // Use process.env to decide which environment to use.
  const target = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "local";
  const client = new Client(
    target === "local" ? Local : Environment("staging"),
  );

  // Then call your `prayerTimesListByLocation`:
  const locationsResponse = await client.timetable.locationFind();
  if (!locationsResponse.success) throw new Error("Failed to fetch locations");

  const locationData = locationsResponse.result.find(
    (loc) => loc.name.toLowerCase() === slug,
  );
  if (!locationData) throw new Error(`Cannot find location ${slug}`);

  const response = await client.timetable.prayerTimesListByLocation(
    locationData.id,
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
  try {
    const times = await getTimes(params.slug.toLowerCase());
    upcomingTimes = beforeNowAndSorted(times, new Date());
  } catch (error) {
    console.error(error);
    return <div>Error loading data</div>;
  }

  // After data is fetched on server, we can pass it to a client component if needed:
  return (
    <main className="mt-2">
      <div className="w-full">
        <Link href="/">
          <button className="bg-[#fd116f] text-white py-2 px-4 rounded mb-4">
            Back Home
          </button>
        </Link>
        <PrayerTimesTable times={upcomingTimes} />
      </div>
    </main>
  );
}
