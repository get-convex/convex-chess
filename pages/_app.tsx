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

  function login() {
    let newName = window.prompt("Pick your name", "");
    if (newName && newName != "Computer") {
      sessionStorage.setItem('convex-chess-user', newName);
      setUserName(newName)        
    }
  }

  pageProps.userName = userName;

  return (
    <ConvexProvider client={convex}>
      <h1>Convex Chess</h1>
      <p className="badge">
        {
          userName ?
          <span>{userName}</span> : <button className="btn btn-primary" onClick={login}>Log to play</button>
        }
      </p>
      <Component {...pageProps} />
    </ConvexProvider>
  )
}

export default MyApp
