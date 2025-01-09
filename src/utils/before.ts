import { timetable } from "@/app/client";

export const beforeNowAndSorted = (
  times: timetable.PrayerTimes[],
  now: Date,
): timetable.PrayerTimes[] => {
  now.setHours(0, 0, 0, 0); // ensure we compare from today's midnight

  const filteredTimes = times.filter(
    (t) => new Date(t.date).getTime() >= now.getTime(),
  );

  // 3. Sort ascending by date
  const sortedTimes = filteredTimes.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  return sortedTimes;
};
