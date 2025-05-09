import { CronJob } from "encore.dev/cron";
import {
  collectFromBirmingham,
  collectFromLondon,
  collectFromManchester,
  retryManchesterCollection,
} from "./timetable";


export const londonCronJob = new CronJob("CollectLondon", {
  title: "Collect prayer times for London",
  schedule: "0 9 1 * *", // 09:00 on 1st day of each month
  endpoint: collectFromLondon,
});

export const birminghamCronJob = new CronJob("CollectBirmingham", {
  title: "Collect prayer times for Birmingham",
  schedule: "0 9 1 * *", // 09:00 on 1st day of each month
  endpoint: collectFromBirmingham,
});

export const manchesterCronJob = new CronJob("CollectManchester", {
  title: "Collect prayer times for Manchester",
  schedule: "0 9 1 * *", // 09:00 on 1st day of each month
  endpoint: collectFromManchester,
});

export const manchesterRetryCronJob = new CronJob("RetryManchesterIfNeeded", {
  title: "Retry Manchester collection if not ready on 1st",
  schedule: "0 14 * * 5", // 14:00 (2 PM) every Friday
  endpoint: retryManchesterCollection,
});
