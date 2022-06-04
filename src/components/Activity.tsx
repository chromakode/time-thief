import { BoxProps, Spinner, VStack } from '@chakra-ui/react'
import React, { useCallback } from 'react'
import { useDoc, usePouch } from 'use-pouchdb'
import { ActivityDefinition } from '../Activities'
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
  const { doc: entityDoc } = useDoc(
    entityId,
    {
      attachments: true,
      binary: true,
    },
    {},
  )
  const entityDocExists = entityDoc?._rev !== ''

  const save = useCallback(
    async function (updates: { [key: string]: any }) {
      let currentRev
      if (entityDocExists) {
        currentRev = await db.get(entityId)
      } else {
        currentRev = { created: Date.now() }
      }
      await db.put({ ...currentRev, ...updates, _id: entityId })
    },
    [db, entityDocExists, entityId],
  )

  const saveAttachment = useCallback(
    async function (id: string, attachment: Blob) {
      await save({
        _attachments: {
          [id]: {
            content_type: attachment.type,
            data: attachment,
          },
        },
      })
    },
    [save],
  )

  const content = activity.content.map((item: any, idx: number) => {
    const Component = contentComponents.get(item.type)
    if (!Component) {
      console.warn('Unknown component type:', item.type)
      return undefined
    }
    return (
      <Component
        key={idx}
        {...item}
        entityDoc={entityDoc}
        save={save}
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
