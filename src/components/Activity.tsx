import { BoxProps, Spinner, VStack } from '@chakra-ui/react'
import { debounce, merge } from 'lodash'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useDoc, usePouch } from 'use-pouchdb'
import { ActivityDefinition } from '../Activities'
import deepTemplate from '../utils/deepTemplate'
import { getClientId } from '../utils/getClientId'
import contentComponents from './contentComponents'

export default function Activity({
  activity,
  seed,
  idx,
  ...props
}: { activity: ActivityDefinition; seed: string; idx: number } & BoxProps) {
  // TODO: entity field mapping? or drop idea in favor of components controlling?
  const entityId = `${seed}-${idx}:${activity.entity.type}`
  const db = usePouch()
  const { doc: entityDoc } = useDoc(entityId, undefined, {
    type: activity.entity.type,
  })
  const fieldsRef = useRef<{ [key: string]: any }>({})
  const fields = fieldsRef.current
  const [contextState, setContextState] = useState(() => ({}))
  const entityDocExists = entityDoc?._rev !== ''

  const save = useCallback(
    async function (updates: { [key: string]: any }) {
      let currentRev
      if (entityDocExists) {
        currentRev = await db.get(entityId)
      } else {
        currentRev = {
          created: Date.now(),
          client: getClientId(),
          type: activity.entity.type,
          activity: activity.id,
        }
      }
      await db.put({ ...currentRev, ...updates, _id: entityId })
    },
    [activity.entity.type, activity.id, db, entityDocExists, entityId],
  )

  const queueUpdate = useMemo(
    () =>
      debounce(() => {
        save(fieldsRef.current)
      }, 500),
    [save],
  )

  const saveAttachment = useCallback(
    async function (id: string, attachment: Blob) {
      const data: any = {
        _attachments: {
          [id]: {
            content_type: attachment.type,
            data: attachment,
          },
        },
      }
      if (attachment.type.startsWith('image/')) {
        const bitmap = await createImageBitmap(attachment)
        data[id] = {
          width: bitmap.width,
          height: bitmap.height,
        }
      }
      fieldsRef.current = merge(fieldsRef.current, data)
      await save(fieldsRef.current)
    },
    [save],
  )

  const set = useCallback(
    (updates: { [key: string]: any }, { dirty } = { dirty: true }) => {
      fieldsRef.current = { ...fieldsRef.current, ...updates }
      if (dirty) {
        queueUpdate()
      }
    },
    [queueUpdate],
  )

  const setContext = useCallback((updates: { [key: string]: any }) => {
    setContextState((context) => ({ ...context, ...updates }))
  }, [])

  const templatedContent = useMemo(
    () =>
      deepTemplate(activity.content, {
        field: fields,
        context: contextState,
      }),
    [activity.content, fields, contextState],
  )

  const content = templatedContent.map((item: any, idx: number) => {
    const Component = contentComponents.get(item.type)
    if (!Component) {
      console.warn('Unknown component type:', item.type)
      return undefined
    }
    return (
      <Component
        key={idx}
        // TODO: remove in favor of spec prop
        {...item}
        context={contextState}
        spec={item}
        entityDoc={entityDoc}
        set={set}
        setContext={setContext}
        saveAttachment={saveAttachment}
      />
    )
  })

  if (!entityDoc) {
    // TODO handle errors, improve loading UI
    return <Spinner />
  }

  return (
    <VStack w="full" h="full" flexShrink="0" overflow="hidden" {...props}>
      {content}
    </VStack>
  )
}
