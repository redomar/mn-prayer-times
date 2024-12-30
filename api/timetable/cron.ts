import { CronJob } from "encore.dev/cron";
import { collectFromBirmingham } from "./timetable";

const _ = new CronJob("CollectBirmingham", {
  title: "Collect prayer times for Birmingham",
  schedule: "0 9 1 * *",
  endpoint: collectFromBirmingham,
});

export default _;
