import '../styles/globals.css'
import type { AppProps } from 'next/app'

import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithAuth0 } from 'convex/react-auth0'

import convexConfig from "../convex.json";
import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
import { useQuery } from '../convex/_generated/react';
import Link from 'next/link';
import { gameTitle } from '../common';
import { Game } from '../convex/search';

const authInfo = convexConfig.authInfo[0];

const address = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!address) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL env variable!");
}
const convex = new ConvexReactClient(address);

function App(props: AppProps) {
  return (
    <div>
      <ConvexProviderWithAuth0
          client={convex}
          authInfo={authInfo}
          loggedOut={
            <MyApp {...props} />
          }
      >
        <MyApp {...props} />
      </ConvexProviderWithAuth0>
    </div>
  )
}

function MyApp({ Component, pageProps }: AppProps) {
  const { user, loginWithRedirect, logout } = useAuth0();

  const [searchInput, setSearchInput] = useState("");

  const userId = useQuery("users:getMyUser") || null;

  const handleChange = (e: any) => {
    e.preventDefault();
    setSearchInput(e.target.value);
  };

  const searchResults = useQuery("search", searchInput) || [];
  return (
    <div>
      <div className="convexImage">
        <a href="/"><img src="convex.svg"></img></a>
        <div>
          <input
            type="text"
            placeholder="Search here"
            onChange={handleChange}
            value={searchInput} />
          </div>
          <table>
            <tbody>
              {searchResults.map((result) =>
                <tr key={result._id.id}>
                  <td>
                    {
                    result._id.tableName == "games" ?
                      <Link href={`/play/${result._id.id}`}>{gameTitle(result as Game)}</Link> :
                      <Link href={`/user/${result._id.id}`}>{(result as any).name}</Link>
                    }
                  </td>
                </tr>
              )}
            </tbody>
        </table>
      </div>
      <h1>Convex Chess</h1>
      <div className="badge">
          {
          user ?
            <div>
              <Link className="profileLink" href={`/user/${userId}`}>{ user.name }</Link>
              <button className="btn btn-secondary" onClick={() => logout({returnTo: window.location.origin})}>Logout</button>
            </div>
          : <button className="btn btn-secondary" onClick={loginWithRedirect}>Login</button>
          }
      </div>
      <Component {...pageProps} />
    </div>
  )
}

export default App
