import { useState, useCallback, useEffect } from 'react'

export default function useLocationURL() {
  const [url, setURL] = useState(() => new URL(window.location.href))

  const handleLocationChange = useCallback(() => {
    setURL(new URL(window.location.href))
  }, [])

  const pushURL = useCallback(
    (url: string) => {
      window.history.pushState(null, document.title, url)
      handleLocationChange()
    },
    [handleLocationChange],
  )

  const replaceURL = useCallback(
    (url: string) => {
      window.history.replaceState(null, document.title, url)
      handleLocationChange()
    },
    [handleLocationChange],
  )

  useEffect(() => {
    window.addEventListener('popstate', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [handleLocationChange])

  return { url, pushURL, replaceURL }
}
