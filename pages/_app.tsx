import { api } from "../convex/_generated/api";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";

import { ConvexReactClient, useQuery } from "convex/react";

import { useState } from "react";
import Link from "next/link";
import { gameTitle } from "../common";

const address = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!address) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL env variable!");
}
const convex = new ConvexReactClient(address);

function App(props: AppProps) {
  return (
    <div>
      <ConvexAuthProvider client={convex}>
        <MyApp {...props} />
      </ConvexAuthProvider>
    </div>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  const { signIn, signOut } = useAuthActions();

  const [searchInput, setSearchInput] = useState("");

  const user = useQuery(api.users.getMyUser) || null;
  console.log("user", user);

  const handleChange = (e: any) => {
    e.preventDefault();
    setSearchInput(e.target.value);
  };

  const searchResults = useQuery(api.search.default, {
    query: searchInput,
  }) || { users: [], games: [] };
  return (
    <div>
      <div className="convexImage">
        <a href="/">
          <img src="/convex.svg"></img>
        </a>
        <div>
          <input
            type="text"
            placeholder="Search here"
            onChange={handleChange}
            value={searchInput}
          />
        </div>
        <table>
          <tbody>
            {searchResults.users.map((result) => (
              <tr key={result._id}>
                <td>
                  {
                    <Link href={`/user/${result._id}`}>
                      {(result as any).name}
                    </Link>
                  }
                </td>
              </tr>
            ))}
            {searchResults.games.map((result) => (
              <tr key={result._id}>
                <td>
                  <Link
                    href={`/play/${result._id}?moveIndex=${
                      result.moveIndex ?? ""
                    }`}
                  >
                    {gameTitle(result)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h1>Convex Chess</h1>
      <div className="badge">
        {user ? (
          <div>
            <Link className="profileLink" href={`/user/${user._id}`}>
              {user.name}
            </Link>
            <button className="btn btn-secondary" onClick={() => signOut()}>
              Logout
            </button>
          </div>
        ) : (
          <button
            className="btn btn-secondary"
            onClick={() => signIn("google")}
          >
            Login
          </button>
        )}
      </div>
      <Component {...pageProps} />
    </div>
  );
}

export default App;
