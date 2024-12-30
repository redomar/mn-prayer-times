"use client";
import { Environment, timetable } from "./client";
import Client from "./client";
import { useEffect, useState } from "react";
import { PrayerTimesTable } from "../components/PrayerTimesTable";

const client = new Client(Environment("staging"));

export default function Home() {
  const [times, setTimes] = useState<timetable.PrayerTimes[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await client.timetable.prayerTimesList();
        if (response.success) {
          setTimes(response.result);
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
  if (times.length === 0) return <div>Loading...</div>;

  const timesByLocation = times.reduce(
    (acc, time) => {
      if (!acc[time.locationId]) {
        acc[time.locationId] = [];
      }
      acc[time.locationId].push(time);
      return acc;
    },
    {} as Record<number, timetable.PrayerTimes[]>,
  );

  return (
    <main className="mt-2">
      <div className="w-full">
        {Object.keys(timesByLocation).map((locationId) => {
          const id = Number(locationId);
          return <PrayerTimesTable key={id} times={timesByLocation[id]} />;
        })}
      </div>
    </main>
  );
}
