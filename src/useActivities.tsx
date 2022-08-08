import { atom, useAtom, useSetAtom } from 'jotai'
import { reduce } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useFind } from 'use-pouchdb'
import Activities, { ActivityDefinition } from './Activities'
import activityData from './activities.json'

export interface ActivityState {
  activities: Array<ActivityDefinition>
  manualActivity: ActivityDefinition
  seed: string
  endTime: number
  timeOfDay: string
}

export function useLastActivityTimes() {
  // TODO: prototype. replace with a stored view

  const { docs, loading } = useFind<any>({
    index: {
      fields: ['activity', 'created'],
    },
    selector: { activity: { $exists: true } },
    sort: ['activity', 'created'],
    fields: ['activity', 'created'],
  })

  return useMemo(
    () =>
      loading
        ? null
        : reduce(
            docs,
            (result, value) => {
              const key = value.activity
              result[key] = Math.max(result[key] ?? 0, value.created)
              return result
            },
            {} as { [key: string]: number },
          ),
    [docs, loading],
  )
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
