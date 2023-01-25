import '../styles/globals.css'
import type { AppProps } from 'next/app'

import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithAuth0 } from 'convex/react-auth0'

import convexConfig from "../convex.json";
import { useAuth0 } from '@auth0/auth0-react';

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
  const { user, loginWithRedirect } = useAuth0();

  pageProps.userName = user?.name ?? "";

  return (
    <div>
      <div className="convexImage">
          <a href="/"><img src="convex.svg"></img></a>
      </div>
      <h1>Convex Chess</h1>
      <p className="badge">
          {
          user ?
            <span>Logged in{ user.name ? ` as ${user.name}` : "" }</span>
          : <button className="btn btn-primary" onClick={loginWithRedirect}>Login</button>
          }
      </p>
      <Component {...pageProps} />
    </div>
  )
}

export default App
