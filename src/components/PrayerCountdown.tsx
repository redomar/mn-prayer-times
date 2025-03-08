'use client';

import { useEffect, useState } from 'react';
import { timetable } from '../app/client';
import { Sun, Sunrise, Moon, Cloud, CloudSun, Calendar } from 'lucide-react';


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

    const formattedDate = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="max-w-7xl mx-auto px-4"> {/* increased from max-w-6xl */}
        <div className="flex items-center gap-2 text-[#fdbd03] mb-4"> {/* changed to yellow */}
            <Calendar className="w-6 h-6" />
            <span className="text-xl">{formattedDate}</span>
        </div>
        
        <div className="bg-[#fd116f] text-white p-8 rounded-lg mb-6 text-center border-2 border-[#fdbd03]"> {/* added yellow border */}
            <div className="text-3xl mb-4">Next Prayer: {nextPrayer.name}</div>
            {isLoading ? (
                <div className="h-[72px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#fdbd03] border-t-transparent"></div> {/* changed to yellow */}
                </div>
            ) : (
                <div className="font-mono text-7xl font-bold">{timeUntil}</div>
            )}
            <div className="text-2xl mt-4">Until {nextPrayer.name} (<span className="text-[#fdbd03]">{nextPrayer.time}</span>)</div> {/* added yellow highlight */}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* For each card, add yellow accents */}
            <div className="bg-[#fd116f] text-white p-4 rounded-lg text-center hover:border-[#fdbd03] border-2 border-transparent transition-all">
                <Moon className="w-8 h-8 mx-auto mb-2 text-[#fdbd03]" /> {/* made icon yellow */}
                    <div className="font-bold">Fajr</div>
                    <div className="text-lg">{today.fajr}</div>
                    <div className="text-sm opacity-75">Jamaat: {today.fajrJamat}</div>
                </div>

                <div className="bg-[#fd116f] text-white p-4 rounded-lg text-center">
                    <Sunrise className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-bold">Sunrise</div>
                    <div className="text-lg">{today.sunrise}</div>
                </div>

                <div className="bg-[#fd116f] text-white p-4 rounded-lg text-center">
                    <Sun className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-bold">Dhuhr</div>
                    <div className="text-lg">{today.dhuhr}</div>
                    <div className="text-sm opacity-75">Jamaat: {today.dhuhrJamat}</div>
                </div>

                <div className="bg-[#fd116f] text-white p-4 rounded-lg text-center">
                    <CloudSun className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-bold">Asr</div>
                    <div className="text-lg">{today.asr}</div>
                    <div className="text-sm opacity-75">Jamaat: {today.asrJamat}</div>
                </div>

                <div className="bg-[#fd116f] text-white p-4 rounded-lg text-center">
                    <Sunrise className="w-8 h-8 mx-auto mb-2 rotate-180" />
                    <div className="font-bold">Maghrib</div>
                    <div className="text-lg">{today.maghrib}</div>
                    <div className="text-sm opacity-75">Jamaat: {today.maghribJamat}</div>
                </div>

                <div className="bg-[#fd116f] text-white p-4 rounded-lg text-center">
                    <Cloud className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-bold">Isha</div>
                    <div className="text-lg">{today.isha}</div>
                    <div className="text-sm opacity-75">Jamaat: {today.ishaJamat}</div>
                </div>
            </div>
        </div>
    );
}