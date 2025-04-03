import { internalMutation } from "./_generated/server";

export const logMessage = internalMutation({
  handler: async () => {
    console.log("Cron job running every 15 seconds");
  },
});