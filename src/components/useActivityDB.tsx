import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePouch, useAllDocs, useDoc } from 'use-pouchdb'
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
  const db = usePouch()

  // When the user swipes to a new manual entity, it's important that the
  // created entity immediately be present in the id list, otherwise the router
  // will consider it an invalid page and redirect.
  const [optimisticId, setOptimisticId] = useState<string | null>(null)

  const { rows } = useAllDocs<any>({
    startkey: `${seed}-manual`,
    endkey: `${seed}-manual\ufff0`,
  })

  const createManualEntity = useCallback(() => {
    const created = Date.now()
    const entityInfo = {
      seed,
      type: manualActivity?.entity.type,
      activity: manualActivity?.id,
      idx: `manual${created}`,
    }
    const entityId = getEntityId(entityInfo)
    const attrs = getDefaultAttrs(entityInfo.type, entityInfo.activity, created)
    setOptimisticId(entityId)
    db.put({ ...attrs, _id: entityId })
  }, [db, manualActivity?.entity.type, manualActivity?.id, seed])

  const manualEntityIds = useMemo(() => {
    const ids = rows.map((r) => r.id).filter((id) => id !== optimisticId)
    if (optimisticId) {
      ids.push(optimisticId)
    }
    return ids
  }, [rows, optimisticId])

  useEffect(() => {
    if (rows.find((r) => r.id === optimisticId)) {
      setOptimisticId(null)
    }
  }, [optimisticId, rows])

  return { manualEntityIds, createManualEntity }
}
