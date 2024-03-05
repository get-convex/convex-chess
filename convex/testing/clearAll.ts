import { testingMutation } from "./wrappers";
import schema from "../schema";

export default testingMutation(async ({ db }) => {
    for (const table of Object.keys(schema.tables)) {
      const docs = await db.query(table as any).collect();
      for (const doc of docs) {
        await db.delete(doc._id);
      }
    }
  });