import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "logEvery15Seconds",
  { seconds: 15 },
  internal.cronFunctions.logMessage
);

export default crons;