import { testingMutation } from "./wrappers";
import schema from "../schema";

export default testingMutation(async ({ db, scheduler, storage }) => {
  for (const table of Object.keys(schema.tables)) {
    const docs = await db.query(table as any).collect();
    await Promise.all(docs.map((doc) => db.delete(doc._id)));
  }
  const scheduled = await db.system.query("_scheduled_functions").collect();
  await Promise.all(scheduled.map((s) => scheduler.cancel(s._id)));
  const storedFiles = await db.system.query("_storage").collect();
  await Promise.all(storedFiles.map((s) => storage.delete(s._id)));
});
