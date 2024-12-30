"use client";
import { Environment, timetable } from "../client";
import Client from "../client";
import { useEffect, useState } from "react";
import { PrayerTimesTable } from "../../components/PrayerTimesTable";
import Link from "next/link";

const client = new Client(Environment("staging"));

export default function LocationPage({ params }: { params: { slug: string } }) {
  const [times, setTimes] = useState<timetable.PrayerTimes[]>([]);
  const [location, setLocation] = useState<timetable.Location | null>(null);
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

        const unwrappedParams = await params;
        const locationData = locationResponse.result.find(
          (loc) => loc.name.toLowerCase() === unwrappedParams.slug.toLowerCase()
        );

        if (!locationData) {
          console.log(locationResponse.result);
          setError(true);
          return;
        }

        setLocation(locationData);

        // Then get the prayer times for this location
        const response = await client.timetable.prayerTimesListByLocation(
          locationData.id
        );
        if (response.success) {
          const filteredTimes = response.result.filter(
            (time) => time.locationId === locationData.id
          );
          setTimes(filteredTimes);
        } else {
          setError(true);
        }
      } catch (error) {
        setError(true);
      }
    };

    fetchData();
  }, [params]);

  if (error) return <div>Error</div>;
  if (!location || times.length === 0) return <div>Loading...</div>;

  return (
      <main className="mt-2">
        <div className="w-full m-4 mt-8">
          <Link href="/">
            <button className="bg-[#fd116f] text-white py-2 px-4 rounded mb-4">
              Back Home
            </button>
          </Link>
          <PrayerTimesTable times={times} />
        </div>
      </main>
    );
}
