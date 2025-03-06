import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { analyzeMoveHttpHandler } from "./analyze";
import { corsRouter } from "convex-helpers/server/cors";

const http = httpRouter();
const corsHttp = corsRouter(http, {
  allowedOrigins: ["*"],
});
auth.addHttpRoutes(http);
corsHttp.route({
  path: "/analyze",
  method: "POST",
  handler: analyzeMoveHttpHandler,
});

export default http;
