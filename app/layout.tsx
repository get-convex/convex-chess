import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "./ConvexClientProvider";

import { SearchBar } from "../components/SearchBar";
import { UserBadge } from "../components/UserBadge";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Convex Chess",
  description: "Chess game powered by Convex",
  icons: {
    icon: "/convex-chess.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider verbose={true}>
      {/* `suppressHydrationWarning` only affects the html tag,
      and is needed by `ThemeProvider` which sets the theme
      class attribute on it */}
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <main
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100vw",
              height: "100vh",
            }}
          >
            <ConvexClientProvider>
              <SearchBar />
              <h1>Convex Chess</h1>
              <UserBadge />
              {children}
            </ConvexClientProvider>
          </main>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
