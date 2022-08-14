import { BoxProps, Spinner, VStack } from '@chakra-ui/react'
import { useAtomValue } from 'jotai'
import { debounce, merge } from 'lodash'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityDefinition } from '../Activities'
import deepTemplate from '../utils/deepTemplate'
import contentComponents from './contentComponents'
import { authorSuffixAtom, useEntity } from './useActivityDB'

export default function Activity({
  activity,
  seed,
  idx,
  ...props
}: {
  activity: ActivityDefinition
  seed: string
  idx: number | string
} & BoxProps) {
  const authorSuffix = useAtomValue(authorSuffixAtom)
  const { entityDoc, saveEntity } = useEntity({
    seed,
    authorSuffix,
    idx,
    type: activity.entity.type,
    activity: activity.id,
  })
  const fieldsRef = useRef<{ [key: string]: any }>({})
  const fields = fieldsRef.current
  const [contextState, setContextState] = useState(() => ({}))

  const queueUpdate = useMemo(
    () =>
      debounce(
        () => {
          saveEntity(fieldsRef.current)
        },
        500,
        { leading: true },
      ),
    [saveEntity],
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
      await saveEntity(fieldsRef.current)
    },
    [saveEntity],
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
    <VStack w="full" h="full" overflow="hidden" {...props}>
      {content}
    </VStack>
  )
}
