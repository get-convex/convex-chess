import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyUser = query(async ({ db, auth }) => {
  const userId = await getAuthUserId({ auth });
  if (!userId) {
    return null;
  }

  const user = await db.get(userId);

  return user;
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
    const userId = await getAuthUserId({ auth });
    if (!userId) {
      return null;
    }

    const user = await db.get(userId);

    if (user === null) {
      throw new Error("Updating profile pic for missing user");
    }

    db.patch(user._id, { profilePic: storageId });
  }
);
