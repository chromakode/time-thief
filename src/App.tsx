import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import {
  ChakraProvider,
  Box,
  BoxProps,
  Heading,
  Textarea,
  VStack,
  HStack,
  Spinner,
  Image,
  Center,
  Flex,
  Text,
  InputGroup,
  IconButton,
  SimpleGrid,
} from '@chakra-ui/react'
import { motion, useAnimation, useDragControls } from 'framer-motion'
import useResizeObserver from 'use-resize-observer'
import PouchDB from 'pouchdb'
import {
  Provider as PouchProvider,
  useAllDocs,
  useDoc,
  usePouch,
} from 'use-pouchdb'
import { MdArticle, MdCamera } from 'react-icons/md'
import '@fontsource/roboto-flex/variable-full.css'
import './App.css'

import activityData from './activities.json'
import Activities, { ActivityDefinition } from './Activities'
import theme from './theme'
import { debounce, range } from 'lodash'

interface ActivityState {
  activities: Array<ActivityDefinition>
  seed: string
  now: number
  endTime: number
  timeOfDay: string
}

const _db = new PouchDB('entities')

function useActivities(): [ActivityState, number] {
  const [now, setNow] = useState(() => Date.now())
  const [activities] = useState(() => new Activities(activityData))
  const [activityState, setActivityState] = useState<ActivityState>(() =>
    activities.chooseActivities(),
  )

  useEffect(() => {
    let timeout: number
    function tick() {
      timeout = window.setTimeout(() => {
        const now = Date.now()
        if (now > activityState.endTime) {
          setActivityState(activities.chooseActivities())
        }
        setNow(now)
        tick()
      }, Math.max(500, 1000 - (Date.now() % 1000)))
    }
    tick()
    return () => {
      clearTimeout(timeout)
    }
  }, [activities, activityState])

  const remainingSeconds = Math.round((activityState.endTime - now) / 1000)

  return [activityState, remainingSeconds]
}

// TODO: per component type types
interface ComponentProps {
  db: PouchDB.Database
  entityDoc: {
    _id: string
    [key: string]: any
  }
  save: (updates: { [key: string]: any }) => void
  saveAttachment: (id: string, attachment: Blob) => void
  [key: string]: any
}

const contentComponents: Map<string, React.FunctionComponent<any>> = new Map()

contentComponents.set(
  'title',
  function Title({ entityDoc, text, save }: ComponentProps) {
    useEffect(() => {
      // FIXME: only set title of entity exists -- can we do this a better way, maybe using the entity field mapping?
      if (entityDoc._rev && entityDoc.title !== text) {
        save({ title: text })
      }
    }, [entityDoc._rev, entityDoc.title, save, text])
    return (
      <Center h="20vh" px="4" flexShrink="0">
        <Heading textStyle="title">{text}</Heading>
      </Center>
    )
  },
)

contentComponents.set(
  'input/multi-line',
  function MultilineInput({ entityDoc, field, save }: ComponentProps) {
    const storedValue = entityDoc[field]
    const handleChange = debounce(function (
      ev: React.ChangeEvent<HTMLTextAreaElement>,
    ) {
      save({ [field]: ev.target.value })
    },
    100)
    return (
      <Flex px="4" w="full" flex="1">
        <Textarea
          w="full"
          h="full"
          variant="filled"
          fontSize="xl"
          resize="none"
          defaultValue={storedValue}
          onChange={handleChange}
          sx={{ touchAction: 'pan-y' }}
        />
      </Flex>
    )
  },
)

contentComponents.set(
  'input/photo',
  function PhotoInput({
    entityDoc,
    field,
    capture,
    saveAttachment,
  }: ComponentProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    const storedImage = entityDoc._attachments?.[field]

    const imageURL = useMemo(
      () => (storedImage ? URL.createObjectURL(storedImage.data) : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [storedImage?.digest],
    )

    function handleClick() {
      inputRef.current?.click()
    }

    function handleChange(ev: React.ChangeEvent<HTMLInputElement>) {
      const { files } = ev.target
      if (files?.length === 1) {
        saveAttachment(field, files[0])
      }
    }
    return (
      <VStack px="4" flex="1" spacing="4">
        <Flex flexGrow="1" flexBasis="0" overflow="hidden" alignItems="center">
          {imageURL && (
            <Image src={imageURL} borderRadius="4" h="full" w="full" />
          )}
        </Flex>
        <InputGroup w="auto" onClick={handleClick}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture={capture}
            onChange={handleChange}
            hidden
          />
          <IconButton
            aria-label="Open camera"
            icon={<MdCamera />}
            fontSize="3xl"
            boxSize="16"
          />
        </InputGroup>
      </VStack>
    )
  },
)

function Activity({
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

function RemainingTime({
  remainingSeconds,
  ...props
}: { remainingSeconds: number } & BoxProps) {
  const remainingMinutes = Math.round(remainingSeconds / 60)
  return (
    <Text textStyle="title" {...props}>
      {remainingSeconds > 60 ? `${remainingMinutes}m` : `${remainingSeconds}s`}
    </Text>
  )
}

function Log() {
  const { rows } = useAllDocs({ include_docs: true })
  // TODO: use content component system to render log
  return (
    <VStack align="flex-start" h="full" overflowY="scroll">
      {rows.map((row) => {
        const entity = row.doc as any
        return (
          <Box>
            {entity.created}
            <Text textStyle="title" textAlign="left">
              {entity.title}
            </Text>
            <Text>{entity.content}</Text>
          </Box>
        )
      })}
    </VStack>
  )
}

const MotionBox = motion<Omit<BoxProps, 'transition' | 'onDragEnd'>>(Box)

function App() {
  const [{ activities, seed }, remainingSeconds] = useActivities()
  const { ref, width = 0 } = useResizeObserver()
  const [showingLog, setShowingLog] = useState(false)
  const [page, setPage] = useState(0)
  const dragControls = useDragControls()
  const finishSwipe = useAnimation()

  useEffect(() => {
    window.screen.orientation.lock('natural').catch(() => {})
  }, [])

  function handleStartDrag(event: React.TouchEvent) {
    dragControls.start(event)
  }

  const canMoveLeft = page > 0
  const canMoveRight = page < activities.length - 1
  const baseOffset = -page * width

  useEffect(() => {
    setPage(0)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }, [seed])

  useEffect(() => {
    finishSwipe.start({ x: -page * width })
  }, [finishSwipe, page, width])

  // FIXME: ignore multiple touch drags
  // TODO: ARIA tabs accessibility
  return (
    <PouchProvider pouchdb={_db}>
      <ChakraProvider theme={theme}>
        <VStack
          ref={ref}
          w="100vw"
          h="full"
          spacing="4"
          overflow="hidden"
          onTouchStart={handleStartDrag}
        >
          <MotionBox
            flex="1"
            w="full"
            animate={finishSwipe}
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
            }}
            drag="x"
            dragConstraints={{
              left: baseOffset + (canMoveRight ? -width : 0),
              right: baseOffset + (canMoveLeft ? width : 0),
            }}
            dragElastic={0.15}
            dragMomentum={false}
            dragDirectionLock
            dragControls={dragControls}
            onDragEnd={(ev, { point, offset, velocity }) => {
              const velocityThreshold = 10000
              const posThreshold = width / 3
              const swipe = Math.abs(offset.x) * velocity.x

              // If the user drags down, an onDragEnd is triggered with a
              // spurious offset = point. Framer bug? Seems detectable because
              // point.x = 0 in such cases.
              const movingRight =
                swipe < -velocityThreshold ||
                (point.x !== 0 && offset.x < -posThreshold)
              const movingLeft =
                swipe > velocityThreshold ||
                (point.x !== 0 && offset.x > posThreshold)

              let newPage = page
              if (movingRight && canMoveRight) {
                newPage++
              } else if (movingLeft && canMoveLeft) {
                newPage--
              }
              setPage(newPage)
            }}
          >
            <HStack h="full" spacing={0}>
              {activities.map((activity, idx) => (
                <Activity
                  w={width}
                  key={`${seed}-${idx}-${activity.id}`}
                  activity={activity}
                  seed={seed}
                  idx={idx}
                />
              ))}
            </HStack>
          </MotionBox>
          <SimpleGrid
            flexShrink="0"
            columns={3}
            h="10vh"
            minH="12"
            w="full"
            px="8"
            alignItems="center"
            justifyContent="space-around"
            sx={{ touchAction: 'none' }}
          >
            <RemainingTime
              remainingSeconds={remainingSeconds}
              justifySelf="start"
            />
            <HStack justifySelf="center">
              {range(activities.length).map((idx) => (
                <Box
                  key={idx}
                  w="14px"
                  h="14px"
                  borderRadius="full"
                  bg={idx === page ? 'primary.600' : 'transparent'}
                  borderWidth={idx === page ? 0 : '3px'}
                  borderColor="primary.600"
                  // TODO: a11y
                  onClick={() => {
                    setPage(idx)
                  }}
                />
              ))}
            </HStack>
            <IconButton
              zIndex={100}
              icon={<MdArticle />}
              aria-label="View log"
              justifySelf="end"
              variant={showingLog ? 'solid' : 'ghost'}
              fontSize="3xl"
              onClick={() => {
                setShowingLog(!showingLog)
              }}
            />
          </SimpleGrid>
        </VStack>
        <MotionBox
          position="absolute"
          left="0"
          top="0"
          w="full"
          h="full"
          bg="primary.50"
          animate={{ y: showingLog ? 0 : '100vh' }}
          transition={{ type: 'tween', duration: 0.25 }}
        >
          {showingLog && <Log />}
        </MotionBox>
      </ChakraProvider>
    </PouchProvider>
  )
}

_db.allDocs({ include_docs: true }).then((ds) => console.log(ds.rows))

export default App
