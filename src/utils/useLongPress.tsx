import { useCallback, useEffect, useRef } from 'react'

export default function useLongPress(onLongPress: () => void, duration = 5000) {
  const timeoutRef = useRef<number | undefined>()
  const callbackRef = useRef<() => void>(onLongPress)

  callbackRef.current = onLongPress

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const onPointerDown = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      callbackRef.current()
    }, duration)
  }, [duration])

  const onPointerUp = useCallback(() => {
    window.clearTimeout(timeoutRef.current)
  }, [])

  return { onPointerDown, onPointerUp }
}
