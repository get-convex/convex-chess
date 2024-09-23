"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

export function SignInButtons() {
  const { signIn, signOut } = useAuthActions();
  const convexAuthState = useConvexAuth();

  const isAuthenticated = convexAuthState.isAuthenticated;
  const isUnauthenticated =
    !convexAuthState.isLoading && !convexAuthState.isAuthenticated;

  return (
    <div>
      {isUnauthenticated ? (
        <button onClick={() => signIn("google")}>Login</button>
      ) : isAuthenticated ? (
        <button onClick={() => signOut()}>Logout</button>
      ) : (
        <button>Loading...</button>
      )}
    </div>
  );
}
