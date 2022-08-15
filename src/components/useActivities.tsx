import { atom, useAtom, useSetAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import Activities, { ActivityDefinition } from '../Activities'
import activityData from '../activities.json'
import { useLastActivityTimes } from './useActivityDB'

export interface ActivityState {
  activities: Array<ActivityDefinition>
  manualActivity: ActivityDefinition
  seed: string
  endTime: number
  timeOfDay: string
}

export const nowAtom = atom(Date.now())

export const defaultActivityState = {
  activities: [],
  manualActivity: null,
  seed: '',
  endTime: 0,
  timeOfDay: 'unknown',
}

export const activityStateAtom = atom<ActivityState>(defaultActivityState)

const endTimeAtom = atom((get) => get(activityStateAtom).endTime)

export const remainingSecondsAtom = atom((get) => {
  const endTime = get(endTimeAtom)
  return endTime !== 0 ? Math.round((endTime - get(nowAtom)) / 1000) : null
})

export function useActivities(): ActivityState {
  const lastActivityTimes = useLastActivityTimes()
  const [activities] = useState(() => new Activities(activityData))
  const setNow = useSetAtom(nowAtom)
  const [activityState, setActivityState] = useAtom(activityStateAtom)

  useEffect(() => {
    let timeout: number | undefined
    let endTime = 0

    function tick() {
      const now = Date.now()
      let nextState
      if (lastActivityTimes !== null && (endTime > 0 || now > endTime)) {
        nextState = activities.chooseActivities({ lastActivityTimes })
      } else if (endTime === 0) {
        nextState = {
          ...defaultActivityState,
          ...activities.getSeed(),
        }
      }
      if (nextState) {
        setActivityState(nextState)
        endTime = nextState.endTime
      }
      setNow(now)
      timeout = window.setTimeout(tick, Math.max(500, 1000 - (now % 1000)))
    }
    tick()

    function handleVisibilityChange(ev: Event) {
      const isVisible = document.visibilityState === 'visible'
      if (isVisible && timeout === undefined) {
        tick()
      } else if (!isVisible && timeout !== undefined) {
        clearTimeout(timeout)
        timeout = undefined
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activities, lastActivityTimes, setActivityState, setNow])

  return activityState
}
