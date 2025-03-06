import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config.js";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config";

const app = defineApp();
app.use(aggregate);
app.use(persistentTextStreaming);

export default app;
