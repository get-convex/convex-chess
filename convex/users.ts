import { v } from "convex/values";
import { DatabaseWriter, mutation, query } from "./_generated/server";

export const getOrCreateUser = async (db: DatabaseWriter, auth: any) => {
  const identity = await auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // Check if we've already stored this identity before.
  const user = await db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (user !== null) {
    // If we've seen this identity before but the name has changed, patch the value.
    if (user.name != identity.name) {
      await db.patch(user._id, { name: identity.name });
    }
    return user._id;
  }
  // If it's a new identity, create a new `User`.
  return db.insert("users", {
    name: identity.name,
    tokenIdentifier: identity.tokenIdentifier,
    profilePic: null,
  });
};

export const getMyUser = query(async ({ db, auth }) => {
  const identity = await auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  return user?._id;
});

export const get = query({
  args: {
    id: v.id("users"),
  },
  handler: async ({ db, storage }, { id }) => {
    const user = await db.get(id);
    let profilePicUrl = null;
    if (user?.profilePic) {
      profilePicUrl = await storage.getUrl(user.profilePic);
    }
    return {
      ...user,
      profilePicUrl,
    };
  },
});

// Generate a short-lived upload URL.
export const generateUploadUrl = mutation(async ({ storage }) => {
  return await storage.generateUploadUrl();
});

// Save the storage ID within a message.
export const setProfilePic = mutation(
  async ({ db, auth }, { storageId }: { storageId: string }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user === null) {
      throw new Error("Updating profile pic for missing user");
    }

    db.patch(user._id, { profilePic: storageId });
  }
);
