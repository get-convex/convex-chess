import '../styles/globals.css'
import type { AppProps } from 'next/app'

import { useState, useEffect } from 'react'

import { ConvexProvider, ConvexReactClient } from 'convex/react'
import clientConfig from '../convex/_generated/clientConfig'
const convex = new ConvexReactClient(clientConfig)

function MyApp({ Component, pageProps }: AppProps) {
  const [userName, setUserName] = useState("")

  useEffect(() => {
    let user = sessionStorage.getItem('convex-chess-user');
    if (!user) {
      return;
    }
    setUserName(user);
  }, [])

  function createUser() {
    const newName = 'User ' + Math.floor(Math.random() * 10000);
    sessionStorage.setItem('convex-chess-user', newName);
    setUserName(newName)
  }

  pageProps.userName = userName;

  return (
    <ConvexProvider client={convex}>
      <h1>Convex Chess</h1>
      <p className="badge">
        {
          userName ?
          <span>{userName}</span> : <button className="btn btn-primary" onClick={createUser}>Log in</button>
        }
      </p>
      <Component {...pageProps} />
    </ConvexProvider>
  )
}

export default MyApp
