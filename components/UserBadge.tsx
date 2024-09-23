"use server";

import { api } from "../convex/_generated/api";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { SignInButtons } from "./SignInButtons";

export async function UserBadge() {
  const token = await convexAuthNextjsToken();
  const user = await fetchQuery(api.users.getMyUser, {}, { token });

  return (
    <div className="badge">
      {user === null ? (
        <SignInButtons />
      ) : (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Link className="profileLink" href={`/user/${user._id}`}>
            {user.name}
          </Link>
          <SignInButtons />
        </div>
      )}
    </div>
  );
}
