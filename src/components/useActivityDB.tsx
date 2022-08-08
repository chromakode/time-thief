import { reduce } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePouch, useAllDocs, useDoc, useFind } from 'use-pouchdb'
import { getClientId } from '../utils/getClientId'

type EntityInfo = {
  seed: string
  type: string
  activity: string
  idx: number | string
}

export function getEntityId(entityInfo: EntityInfo) {
  const { seed, idx, type } = entityInfo
  return `${seed}-${idx}:${type}`
}

export function parseIdxFromEntityId(entityId: string) {
  return entityId.split(':')[0].split('-')[1]
}

function getDefaultAttrs(
  type: string,
  activity: string,
  created: number = Date.now(),
) {
  return {
    created,
    type,
    activity,
    client: getClientId(),
  }
}

export function useEntity(entityInfo: EntityInfo) {
  const db = usePouch()
  const entityId = getEntityId(entityInfo)

  const { doc: entityDoc } = useDoc(entityId, undefined, {
    type: entityInfo.type,
  })
  const entityDocExists = entityDoc?._rev !== ''

  const saveEntity = useCallback(
    async function (updates: { [key: string]: any }) {
      let currentRev
      if (entityDocExists) {
        currentRev = await db.get(entityId)
      } else {
        currentRev = getDefaultAttrs(entityInfo.type, entityInfo.activity)
      }
      await db.put({ ...currentRev, ...updates, _id: entityId })
    },
    [db, entityDocExists, entityId, entityInfo.type, entityInfo.activity],
  )

  return { entityDoc, saveEntity }
}

export function useManualEntities({
  seed,
  manualActivity,
}: {
  seed: string
  manualActivity: any | null
}) {
  const [loaded, setLoaded] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)

  const { rows, loading } = useAllDocs<any>({
    startkey: `${seed}-manual`,
    endkey: `${seed}-manual\ufff0`,
    update_seq: true,
  })

  const createManualDraft = useCallback(() => {
    const created = Date.now()
    const entityInfo = {
      seed,
      type: manualActivity?.entity.type,
      activity: manualActivity?.id,
      idx: `manual${created}`,
    }
    const entityId = getEntityId(entityInfo)
    setDraftId(entityId)
  }, [manualActivity?.entity.type, manualActivity?.id, seed])

  const cleanupManualDraft = useCallback(() => {
    setDraftId(null)
  }, [])

  const manualEntityIds = useMemo(() => {
    const ids = rows.map((r) => r.id).filter((id) => id !== draftId)
    if (draftId) {
      ids.push(draftId)
    }
    return ids
  }, [rows, draftId])

  useEffect(() => {
    if (rows.find((r) => r.id === draftId)) {
      setDraftId(null)
    }
  }, [draftId, rows])

  // FIXME: use-pouchdb seems to state change from loading to done without
  // returning any rows, then load again and return a real result
  useEffect(() => {
    if (loading === false) {
      setLoaded(true)
    }
  }, [loading])

  return {
    manualEntityIds,
    manualEntityDraftId: draftId,
    manualEntitiesLoaded: loaded,
    cleanupManualDraft,
    createManualDraft,
  }
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
