import { timetable } from "@/app/client";

export const formatTimeForICS = (date: string, time: string) => {
  const [hours, minutes] = time.split(":");
  const dateObj = new Date(date);
  dateObj.setHours(parseInt(hours), parseInt(minutes));
  return dateObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

export const createICSEvent = (
  date: string,
  prayerName: string,
  time: string,
) => {
  const startTime = formatTimeForICS(date, time);
  const endTime =
    new Date(
      new Date(
        startTime.slice(0, 4) +
          "-" +
          startTime.slice(4, 6) +
          "-" +
          startTime.slice(6, 8) +
          "T" +
          startTime.slice(9, 11) +
          ":" +
          startTime.slice(11, 13) +
          "Z",
      ).getTime() +
        5 * 60000,
    )
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z";

  return [
    "BEGIN:VEVENT",
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${prayerName} Prayer`,
    "END:VEVENT",
  ].join("\n");
};

export const downloadICS = (
  prayer: timetable.PrayerTimes,
  prayerName: string,
  time: string,
) => {
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    createICSEvent(prayer.date, prayerName, time),
    "END:VCALENDAR",
  ].join("\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${prayerName}-prayer-${prayer.date}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const createMonthlyICS = (times: timetable.PrayerTimes[]) => {
  const events = times.flatMap((prayer) => [
    createICSEvent(prayer.date, "Fajr", prayer.fajr),
    createICSEvent(prayer.date, "Dhuhr", prayer.dhuhrJamat),
    createICSEvent(prayer.date, "Asr", prayer.asrJamat),
    createICSEvent(prayer.date, "Maghrib", prayer.maghrib),
    createICSEvent(prayer.date, "Isha", prayer.ishaJamat),
  ]);

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const month = new Date(times[0].date).toLocaleString("default", {
    month: "long",
  });
  const year = new Date(times[0].date).getFullYear();
  link.download = `prayer-times-${month}-${year}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
