import { useCallback, useEffect, useState } from 'react'

export default function useLocationHash() {
  const [hash, setHash] = useState(() => window.location.hash)

  const handleHashChange = useCallback(() => {
    setHash(window.location.hash)
  }, [])

  useEffect(() => {
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [handleHashChange])

  return hash
}
