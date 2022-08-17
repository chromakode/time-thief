import { useAsyncEffect } from '@react-hook/async'
import { atom, useAtomValue, useSetAtom } from 'jotai'
import PouchDB from 'pouchdb'
import { useCallback, useEffect, useMemo, useState } from 'react'
import slugify from 'slugify'
import { useAllDocs, useDoc, usePouch } from 'use-pouchdb'
import { getClientId } from '../utils/getClientId'

export const syncStateAtom = atom<
  null | 'disabled' | 'initializing' | 'syncing' | 'idle' | 'error'
>(null)

export const authorNameAtom = atom<string | null>(null)
export const authorSuffixAtom = atom<string>((get) => {
  const name = get(authorNameAtom)
  if (name === null) {
    return ''
  }
  return '@' + slugify(name)
})

export function useSetupDB() {
  const db = usePouch<any>()

  const setSyncState = useSetAtom(syncStateAtom)
  const setAuthorName = useSetAtom(authorNameAtom)

  const { status } = useAsyncEffect(async () => {
    const appDesignDoc = {
      _id: '_design/app',
      views: {
        activityTimes: {
          map: `(doc) => {
          emit(doc.activity, doc.created)
        }`,
          reduce: `(keys, values, rereduce) => Math.max(...values)`,
        },
      },
    }

    await db.upsert(appDesignDoc._id, () => appDesignDoc)

    // Multiplayer: check for a client info document. If it contains an author
    // name, we're in multiplayer mode.
    let clientInfo
    try {
      clientInfo = await db.get(`$client/${getClientId()}`)
    } catch {}
    setAuthorName(clientInfo?.authorName ?? null)

    const syncEndpoint = localStorage['syncEndpoint']
    if (syncEndpoint && syncEndpoint.startsWith('https://')) {
      setSyncState('initializing')
      const initialSync = db.replicate.to(syncEndpoint)
      initialSync.on('error', (ev) => {
        setSyncState('error')
      })
      try {
        await initialSync
      } catch (err) {}

      const syncEvents = PouchDB.sync(db, syncEndpoint, {
        live: true,
        retry: true,
      })
      syncEvents.on('active', () => {
        setSyncState('syncing')
      })
      syncEvents.on('paused', () => {
        setSyncState('idle')
      })
    } else {
      setSyncState('disabled')
    }
  }, [])

  return status
}

type EntityInfo = {
  seed: string
  authorSuffix: string
  type: string
  activity: string
  idx: number | string
}

export function getEntityId(entityInfo: EntityInfo) {
  const { seed, authorSuffix, idx, type } = entityInfo
  return `${seed}${authorSuffix}-${idx}:${type}`
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
  const authorSuffix = useAtomValue(authorSuffixAtom)
  const [loaded, setLoaded] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)

  const { rows, loading } = useAllDocs<any>({
    startkey: `${seed}${authorSuffix}-manual`,
    endkey: `${seed}${authorSuffix}-manual\ufff0`,
  })

  const createManualDraft = useCallback(() => {
    const created = Date.now()
    const entityInfo = {
      seed,
      authorSuffix: authorSuffix,
      type: manualActivity?.entity.type,
      activity: manualActivity?.id,
      idx: `manual${created}`,
    }
    const entityId = getEntityId(entityInfo)
    setDraftId(entityId)
  }, [authorSuffix, manualActivity?.entity.type, manualActivity?.id, seed])

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

export async function getLastActivityTimes(db: PouchDB.Database<any>) {
  const { rows } = await db.query('app/activityTimes', {
    group: true,
    group_level: 1,
    stale: 'update_after',
  })

  return Object.fromEntries(rows.map(({ key, value }) => [key, value]))
}
