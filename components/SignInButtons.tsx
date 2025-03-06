"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useState } from "react";

export function SignInButtons() {
  const { signIn, signOut } = useAuthActions();
  const convexAuthState = useConvexAuth();
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

  const isAuthenticated = convexAuthState.isAuthenticated;
  const isUnauthenticated =
    !convexAuthState.isLoading && !convexAuthState.isAuthenticated;

  return (
    <div>
      {isUnauthenticated ? (
        <>
          <button onClick={() => signIn("google")}>Login</button>
          {process.env.NEXT_PUBLIC_ALLOW_PASSWORD_LOGIN === "true" && (
            <button onClick={() => setShowPasswordLogin(!showPasswordLogin)}>
              Login with Password
            </button>
          )}
          {showPasswordLogin && <LoginWithPassword />}
        </>
      ) : isAuthenticated ? (
        <button onClick={() => signOut()}>Logout</button>
      ) : (
        <button>Loading...</button>
      )}
    </div>
  );
}

function LoginWithPassword() {
  const [email, setEmail] = useState("test@convex.dev");
  const [password, setPassword] = useState("TestTest123");
  const [error, setError] = useState<string | null>(null);
  const [flow, setFlow] = useState<"signUp" | "signIn">("signUp");
  const { signIn } = useAuthActions();
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await signIn("password", { email, password, flow: "signUp" });
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };
  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <a onClick={() => setFlow(flow === "signUp" ? "signIn" : "signUp")}>
        {flow === "signUp" ? "Sign in instead" : "Sign up instead"}
      </a>
      <button type="submit">{flow === "signUp" ? "Sign Up" : "Sign In"}</button>
      {error && <div>{error}</div>}
    </form>
  );
}
