import { atom, useAtom, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
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

export const activityStateAtom = atom<ActivityState>({
  activities: [],
  manualActivity: null,
  seed: '',
  endTime: 0,
  timeOfDay: 'unknown',
})

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
    let timeout: number
    function tick() {
      const now = Date.now()
      if (
        lastActivityTimes !== null &&
        (activityState === null || now > activityState.endTime)
      ) {
        setActivityState(activities.chooseActivities({ lastActivityTimes }))
      }
      setNow(now)
      timeout = window.setTimeout(
        tick,
        Math.max(500, 1000 - (Date.now() % 1000)),
      )
    }
    tick()
    return () => {
      clearTimeout(timeout)
    }
  }, [activities, activityState, lastActivityTimes, setActivityState, setNow])

  return activityState
}
