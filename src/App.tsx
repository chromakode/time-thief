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
import { Provider as PouchProvider, useDoc, usePouch } from 'use-pouchdb'
import { MdCamera } from 'react-icons/md'
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

function useActivities(): ActivityState {
  const [activities] = useState(() => new Activities(activityData))
  const [activityState, setActivityState] = useState<ActivityState>(() =>
    activities.chooseActivities(),
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      setActivityState(activities.chooseActivities())
    }, Date.now() - activityState.endTime)
    return () => {
      clearTimeout(timeout)
    }
  }, [activities, activityState.endTime])

  return activityState
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
      <Center h="20vh" px="4">
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
          defaultValue={storedValue}
          onChange={handleChange}
        />
      </Flex>
    )
  },
)

contentComponents.set(
  'input/photo',
  function PhotoInput({ entityDoc, field, saveAttachment }: ComponentProps) {
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
      <VStack px="4" flex="1">
        <Box flex="1">{imageURL && <Image src={imageURL} />}</Box>
        <InputGroup w="auto" onClick={handleClick}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
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
    <VStack w="full" h="full" flexShrink="0" {...props}>
      {content}
    </VStack>
  )
}

function RemainingTime({ endTime, ...props }: { endTime: number } & BoxProps) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  })
  const remainingMinutes = Math.round((endTime - now) / (60 * 1000))
  return (
    <Text textStyle="title" {...props}>
      {remainingMinutes}m
    </Text>
  )
}

const MotionBox = motion<Omit<BoxProps, 'transition' | 'onDragEnd'>>(Box)

function App() {
  const { activities, seed, endTime } = useActivities()
  const { ref, width = 0 } = useResizeObserver()
  const [page, setPage] = useState(0)
  const dragControls = useDragControls()
  const finishSwipe = useAnimation()

  function handleStartDrag(event: React.TouchEvent) {
    dragControls.start(event)
  }

  const canMoveLeft = page > 0
  const canMoveRight = page < activities.length - 1
  const baseOffset = -page * width

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
              finishSwipe.start({ x: -newPage * width })
            }}
          >
            <HStack h="full" spacing={0}>
              {activities.map((activity, idx) => (
                <Activity
                  w={width}
                  key={idx}
                  activity={activity}
                  seed={seed}
                  idx={idx}
                />
              ))}
            </HStack>
          </MotionBox>
          <SimpleGrid
            columns={3}
            h="10vh"
            w="full"
            px="8"
            alignItems="center"
            justifyContent="space-around"
          >
            <RemainingTime endTime={endTime} justifySelf="start" />
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
                />
              ))}
            </HStack>
            <Box
              w="24px"
              h="24px"
              borderRadius="4"
              transform="rotate(45deg)"
              bg="primary.600"
              justifySelf="end"
            />
          </SimpleGrid>
        </VStack>
      </ChakraProvider>
    </PouchProvider>
  )
}

_db.allDocs({ include_docs: true }).then((ds) => console.log(ds.rows))

export default App
