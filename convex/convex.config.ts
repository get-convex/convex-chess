import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config.js";
import workpool from "@convex-dev/workpool/convex.config";


const app = defineApp();
app.use(aggregate);
app.use(workpool, { name: "analysisWorkpool" });
export default app;
