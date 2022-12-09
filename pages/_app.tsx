import '../styles/globals.css'
import type { AppProps } from 'next/app'

import { useState, useEffect } from 'react'

import { ConvexProvider, ConvexReactClient } from 'convex/react'
import clientConfig from '../convex/_generated/clientConfig'
const convex = new ConvexReactClient(clientConfig)

function MyApp({ Component, pageProps }: AppProps) {
  const [userName, setUserName] = useState('user')

  useEffect(() => {
    setUserName('User ' + Math.floor(Math.random() * 10000))
  }, [])

  return (
    <ConvexProvider client={convex}>
      <h1>Convex Chess</h1>
      <p className="badge">
        <span>{userName}</span>
      </p>
      <Component {...pageProps} />
    </ConvexProvider>
  )
}

export default MyApp
