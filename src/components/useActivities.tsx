import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithReducer } from 'jotai/utils'
import { useEffect, useRef, useState } from 'react'
import { usePouch } from 'use-pouchdb'
import Activities, { ActivityDefinition } from '../Activities'
import activityData from '../activities.json'
import { customDataAtom, getLastActivityTimes } from './useActivityDB'

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

export const endTimeAtom = atom((get) => get(activityStateAtom).endTime)

export const remainingSecondsAtom = atom((get) => {
  const endTime = get(endTimeAtom)
  return endTime !== 0 ? Math.ceil((endTime - get(nowAtom)) / 1000) : null
})

export const pageVisibleIdxAtom = atomWithReducer(0, (prev) => prev + 1)

export function useActivities(): ActivityState {
  const db = usePouch()
  const customData = useAtomValue(customDataAtom)
  const [activities] = useState(() => new Activities(activityData, customData))
  const setNow = useSetAtom(nowAtom)
  const [activityState, setActivityState] = useAtom(activityStateAtom)
  const incPageVisibleIdx = useSetAtom(pageVisibleIdxAtom)
  const endTimeRef = useRef(0)

  useEffect(() => {
    let timeout: number | undefined

    async function tick() {
      const now = Date.now()
      const endTime = endTimeRef.current

      let nextState
      if (endTime === 0 || now > endTime) {
        const lastActivityTimes = await getLastActivityTimes(db)
        nextState = activities.chooseActivities({ lastActivityTimes })
      } else if (endTime === 0) {
        nextState = {
          ...defaultActivityState,
          ...activities.getSeed(),
        }
      }
      if (nextState) {
        setActivityState(nextState)
        endTimeRef.current = nextState.endTime
      }
      setNow(now)
      timeout = window.setTimeout(tick, Math.max(50, 1000 - (now % 1000)))
    }
    tick()

    function handleVisibilityChange(ev: Event) {
      const isVisible = document.visibilityState === 'visible'
      if (isVisible && timeout === undefined) {
        incPageVisibleIdx()
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
  }, [activities, db, incPageVisibleIdx, setActivityState, setNow])

  return activityState
}
