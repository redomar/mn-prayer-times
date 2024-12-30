"use client";
import { Environment, timetable } from "./client";
import Client from "./client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PrayerTimesTable } from "@/components/PrayerTimesTable";

const client = new Client(Environment("staging"));

export default function Home() {
  const [locations, setLocations] = useState<timetable.Location[]>([]);
  const [times, setTimes] = useState<timetable.PrayerTimes[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await client.timetable.locationFind();
        const london = await client.timetable.prayerTimesListByLocation(1);
        if (response?.success && london?.success) {
          setLocations(response?.result);
          setTimes(london?.result);
        } else {
          setError(true);
        }
      } catch (error) {
        console.log(error);
        setError(true);
      }
    };

    fetchData();
  }, []);

  if (error) return <div>Error</div>;
  if (locations.length === 0) return <div>Loading...</div>;

  return (
    <main className="mt-2">
      <div className="relative m-4">
        <h1>Other Locations</h1>
        <ul className="flex space-x-4">
          {locations.map((location) => (
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
      <PrayerTimesTable times={times} />
    </main>
  );
}
