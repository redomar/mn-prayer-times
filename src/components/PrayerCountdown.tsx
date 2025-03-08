'use client';

import { useEffect, useState } from 'react';
import { timetable } from '../app/client'; // adjust import path as needed

function getNextPrayer(today: timetable.PrayerTimes): { name: string; time: string } {
  const now = new Date();
  const prayers = [
    { name: 'Fajr', time: today.fajrJamat },
    { name: 'Dhuhr', time: today.dhuhrJamat },
    { name: 'Asr', time: today.asrJamat },
    { name: 'Maghrib', time: today.maghribJamat },
    { name: 'Isha', time: today.ishaJamat },
  ];

  const currentDate = new Date().toISOString().split('T')[0];
  
  for (const prayer of prayers) {
    const prayerTime = new Date(`${currentDate}T${prayer.time}`);
    if (prayerTime > now) {
      return prayer;
    }
  }
  
  // If no prayer times are left today, return Fajr
  return { name: 'Fajr', time: today.fajr };
}

function getTimeUntil(timeString: string): string {
  const now = new Date();
  const currentDate = new Date().toISOString().split('T')[0];
  const targetTime = new Date(`${currentDate}T${timeString}`);
  
  if (targetTime < now) {
    // Add 24 hours if the prayer time has passed
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  const diff = targetTime.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function PrayerCountdown({ today }: { today: timetable.PrayerTimes }) {
    const [isLoading, setIsLoading] = useState(true);
    const [timeUntil, setTimeUntil] = useState('00:00:00');
    const [nextPrayer, setNextPrayer] = useState(() => getNextPrayer(today));
  
    useEffect(() => {
      const next = getNextPrayer(today);
      setNextPrayer(next);
      setTimeUntil(getTimeUntil(next.time));
      setIsLoading(false);
  
      const interval = setInterval(() => {
        const next = getNextPrayer(today);
        setNextPrayer(next);
        setTimeUntil(getTimeUntil(next.time));
      }, 1000);
  
      return () => clearInterval(interval);
    }, [today]);
  
    return (
        <div>
      <div className="bg-[#fd116f] text-white p-8 rounded-lg mb-4 text-center">
        <div className="text-2xl mb-2">Next Prayer: {nextPrayer.name}</div>
        {isLoading ? (
          <div className="h-[72px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
        ) : (
          <div className="font-mono text-6xl font-bold">{timeUntil}</div>
        )}
        <div className="text-xl mt-2">Until {nextPrayer.name} ({nextPrayer.time})</div>
      </div>
      <div className="grid grid-cols-5 gap-4 p-4 bg-gray-100 rounded-lg mb-4">
  <div className="bg-[#fd116f] text-white p-3 rounded text-center">
    <div className="font-bold">Fajr</div>
    <div>{today.fajr}</div>
    <div className="text-sm">Jamaat: {today.fajrJamat}</div>
  </div>
  <div className="bg-[#fd116f] text-white p-3 rounded text-center">
    <div className="font-bold">Dhuhr</div>
    <div>{today.dhuhr}</div>
    <div className="text-sm">Jamaat: {today.dhuhrJamat}</div>
  </div>
  <div className="bg-[#fd116f] text-white p-3 rounded text-center">
    <div className="font-bold">Asr</div>
    <div>{today.asr}</div>
    <div className="text-sm">Jamaat: {today.asrJamat}</div>
  </div>
  <div className="bg-[#fd116f] text-white p-3 rounded text-center">
    <div className="font-bold">Maghrib</div>
    <div>{today.maghrib}</div>
    <div className="text-sm">Jamaat: {today.maghribJamat}</div>
  </div>
  <div className="bg-[#fd116f] text-white p-3 rounded text-center">
    <div className="font-bold">Isha</div>
    <div>{today.isha}</div>
    <div className="text-sm">Jamaat: {today.ishaJamat}</div>
  </div>
</div>
      </div>
    );
  }