"use client";
import { ConvexError } from "convex/values";
import { ErrorBoundary } from "react-error-boundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ErrorBoundary fallbackRender={ErrorFallback}>{children}</ErrorBoundary>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  if (error instanceof ConvexError) {
    if (error.data.code === "GameNotFound") {
      console.error(`Game ${error.data.gameId} not found`);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    return <div>Error: {error.data.code}</div>;
  }
  return <div>Error: {error.message}</div>;
}
