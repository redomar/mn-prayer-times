"use client";
import { Environment, timetable } from "../client";
import Client from "../client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PrayerTimesTable } from "@/components/PrayerTimesTable";

const client = new Client(Environment("staging"));

const Page = () => {
  const { slug } = useParams();
  const [times, setTimes] = useState<timetable.PrayerTimes[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First get the location data
        const locationResponse = await client.timetable.locationFind();
        if (!locationResponse.success) {
          setError(true);
          return;
        }

        const locationData = locationResponse.result.find(
          (loc) =>
            loc.name.toLowerCase() ===
            (Array.isArray(slug) ? slug[0].toLowerCase() : slug?.toLowerCase())
        );

        if (!locationData) {
          console.log(locationResponse.result);
          setError(true);
          return;
        }

        // Then get the prayer times for this location
        const response = await client.timetable.prayerTimesListByLocation(
          locationData.id
        );
        if (response.success) {
          setTimes(response?.result);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (error) {
    return <div>Error loading data</div>;
  }

  return (
    <main className="mt-2">
      <div className="w-full">
        <Link href="/">
          <button className="bg-[#fd116f] text-white py-2 px-4 rounded mb-4">
            Back Home
          </button>
        </Link>
        <PrayerTimesTable times={times} />
      </div>
    </main>
  );
};

export default Page;
