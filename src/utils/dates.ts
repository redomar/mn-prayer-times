import { timetable } from "@/app/client";

export const formatDate = (date: string) => {
    if (date === "") return "";
    if (date === new Date().toISOString().split("T")[0]) return "Today";
    return new Date(date).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };
  
  export const getRowClassName = (date: string) => {
    const currentDate = new Date(date);
    const isToday = date === new Date().toISOString().split("T")[0];
    const isWeekend = currentDate.getDay() === 6 || currentDate.getDay() === 0;
    const isFirstOfMonth = currentDate.getDate() === 1;
    const isFriday = currentDate.getDay() === 5;
  
    if (isToday) return "bg-[#fdbd03] text-white font-bold";
    if (isWeekend) return "bg-gray-200/50 text-gray-500";
    if (isFriday) return "bg-[#fd116f] text-black";
    if (isFirstOfMonth) return "bg-black text-white";
    return "even:bg-black/5 odd:bg-black/10";
  };
  
  export const processTimesData = (times: timetable.PrayerTimes[]) => {
    return times
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .filter((time) => {
        const date = new Date(time.date);
        return date.getTime() > Date.now() - 1000 * 60 * 60 * 24;
      });
  };