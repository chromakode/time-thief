import {
  Box,
  BoxProps,
  Flex,
  HStack,
  Icon,
  IconButton,
  SimpleGrid,
  Text,
  useColorMode,
  VStack,
} from '@chakra-ui/react'
import '@fontsource/roboto-flex/variable-full.css'
import useSize from '@react-hook/size'
import 'focus-visible/dist/focus-visible'
import {
  AnimatePresence,
  useDragControls,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import { range, reduce } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MdAdd, MdArticle } from 'react-icons/md'
import { useFind } from 'use-pouchdb'
import Activities, { ActivityDefinition } from './Activities'
import activityData from './activities.json'
import './App.css'
import Activity from './components/Activity'
import Carousel from './components/Carousel'
import { IntroModal, useShowingIntro } from './components/IntroModal'
import Log from './components/Log'
import MotionBox from './components/MotionBox'
import {
  parseIdxFromEntityId,
  useManualEntities,
} from './components/useActivityDB'
import useLocationURL from './utils/useLocationURL'
import useLongPress from './utils/useLongPress'

interface ActivityState {
  activities: Array<ActivityDefinition>
  manualActivity: ActivityDefinition
  seed: string
  now: number
  endTime: number
  timeOfDay: string
}

function useLastActivityTimes() {
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

function useActivities(): [ActivityState, number | null] {
  const [now, setNow] = useState(() => Date.now())
  const lastActivityTimes = useLastActivityTimes()
  const [activities] = useState(() => new Activities(activityData))
  const [activityState, setActivityState] = useState<ActivityState>(() => ({
    activities: [],
    manualActivity: null,
    seed: '',
    now,
    endTime: 0,
    timeOfDay: 'unknown',
  }))

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
  }, [activities, activityState, lastActivityTimes])

  const remainingSeconds =
    activityState.endTime !== 0
      ? Math.round((activityState.endTime - now) / 1000)
      : null

  return [activityState, remainingSeconds]
}

function RemainingTime({
  remainingSeconds,
  ...props
}: { remainingSeconds: number } & BoxProps) {
  const { colorMode } = useColorMode()
  const [pulseKey, setPulseKey] = useState<number | undefined>()

  const remainingMinutes = Math.ceil(remainingSeconds / 60)

  useEffect(() => {
    if (remainingSeconds <= 10) {
      setPulseKey(remainingSeconds)
    } else if (remainingSeconds <= 60) {
      setPulseKey(Math.ceil(remainingSeconds / 10) * 10)
    } else if (remainingMinutes <= 3) {
      setPulseKey(remainingMinutes * 60)
    }
  }, [remainingSeconds, remainingMinutes])

  return (
    <Flex justifySelf="flex-start" position="relative">
      <Text
        textStyle="title"
        whiteSpace="pre"
        minW="6"
        textAlign="center"
        {...props}
      >
        {remainingSeconds > 60
          ? `${remainingMinutes}m`
          : `${remainingSeconds}s`}
      </Text>
      <AnimatePresence>
        <MotionBox
          position="absolute"
          left="50%"
          bottom="50%"
          key={pulseKey}
          borderColor={colorMode === 'dark' ? 'primary.200' : 'primary.600'}
          borderRadius="9999px"
          initial={{
            width: 60,
            height: 60,
            translateX: -30,
            translateY: 30,
            opacity: 0,
            borderWidth: 1,
          }}
          exit={{
            width: 200,
            height: 200,
            translateX: -100,
            translateY: 100,
            opacity: [0, 0.25, 1, 0],
          }}
          transition={{ duration: 1.5 }}
        />
      </AnimatePresence>
    </Flex>
  )
}

function useRouter({ maxPages }: { maxPages: number }) {
  const { url, pushURL, replaceURL } = useLocationURL()

  const locationHashPage = parseInt(url.hash.substring(1))
  const page =
    Number.isInteger(locationHashPage) &&
    locationHashPage > 0 &&
    locationHashPage < maxPages
      ? locationHashPage
      : 0

  const setPage = useCallback(
    (nextPage: number) => {
      const url = new URL(window.location.href)
      url.hash = nextPage.toString()
      replaceURL(url.toString())
    },
    [replaceURL],
  )

  const isShowingLog = url.pathname.substring(1) === 'log'
  const setShowingLog = useCallback(
    (newShowingLog: boolean) => {
      if (newShowingLog) {
        const url = new URL(window.location.href)
        url.pathname = 'log'
        pushURL(url.toString())
      } else {
        window.history.back()
      }
    },
    [pushURL],
  )

  return { page, setPage, isShowingLog, setShowingLog }
}

function App() {
  const { colorMode } = useColorMode()
  const [{ activities, manualActivity, seed }, remainingSeconds] =
    useActivities()
  const {
    manualEntityIds,
    manualEntityDraftId,
    manualEntitiesLoaded,
    createManualDraft,
    cleanupManualDraft,
  } = useManualEntities({
    seed,
    manualActivity,
  })
  const ref = useRef<HTMLDivElement>(null)
  const [width = 0] = useSize(ref)
  const { isShowingIntro, showIntro } = useShowingIntro()

  const pageCount = activities.length + manualEntityIds.length
  const lastPage = pageCount - (manualEntityDraftId ? 1 : 0)
  const { page, setPage, isShowingLog, setShowingLog } = useRouter({
    maxPages: pageCount,
  })

  const dragControls = useDragControls()
  const dragMotionValue = useMotionValue(0)
  const dragDraftRange = [-(lastPage - 1) * width, -lastPage * width]
  const manualDraftPipWidth = useTransform(dragMotionValue, dragDraftRange, [
    0,
    14 + 8,
  ])
  const manualDraftPipOpacity = useTransform(
    dragMotionValue,
    dragDraftRange,
    [0, 1],
  )

  function blur() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const logLongPressProps = useLongPress(() => {
    localStorage['syncEndpoint'] = window.prompt(
      'sync endpoint',
      localStorage['syncEndpoint'] ?? '',
    )
  })

  function handleStartDrag(event: React.TouchEvent) {
    dragControls.start(event)
  }

  function handlePageChange(page: number) {
    setPage(page)
    blur()
    if (page < pageCount - 1) {
      cleanupManualDraft()
    }
  }

  function handleCreateManualEntry() {
    createManualDraft()
    setPage(page + 1)
  }

  const ready = width !== 0 && seed && manualEntitiesLoaded

  // FIXME: ignore multiple touch drags
  // TODO: ARIA tabs accessibility
  return (
    <>
      <IntroModal />
      <VStack
        ref={ref}
        w="100vw"
        h="full"
        spacing="4"
        overflow="hidden"
        opacity={isShowingIntro && !isShowingLog ? '0' : '1'}
        onTouchStart={handleStartDrag}
      >
        <Flex flex="1" w="full" position="relative">
          {ready && (
            <AnimatePresence initial={false} exitBeforeEnter>
              <MotionBox
                key={seed}
                position="absolute"
                inset="0"
                display="flex"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.25, ease: 'easeOut' },
                }}
                exit={{
                  opacity: 0,
                  scale: 1.05,
                  transition: { duration: 0.25, ease: 'easeOut' },
                }}
              >
                <Carousel
                  width={width}
                  page={page}
                  dragMotionValue={dragMotionValue}
                  dragControls={dragControls}
                  onPageChange={handlePageChange}
                  onDragToLastPage={handleCreateManualEntry}
                  lastPage={
                    manualActivity &&
                    !manualEntityDraftId && (
                      <Activity
                        w={width}
                        key="manual-draft"
                        activity={manualActivity}
                        seed={seed}
                        idx={activities.length}
                      />
                    )
                  }
                >
                  {activities.map((activity, idx) => (
                    <Activity
                      w={width}
                      key={`${seed}-${idx}-${activity.id}`}
                      activity={activity}
                      seed={seed}
                      idx={idx}
                    />
                  ))}
                  {manualEntityIds.map((id) => (
                    <Activity
                      w={width}
                      key={id}
                      activity={manualActivity}
                      seed={seed}
                      idx={parseIdxFromEntityId(id)}
                    />
                  ))}
                </Carousel>
              </MotionBox>
            </AnimatePresence>
          )}
        </Flex>
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
          {remainingSeconds == null ? (
            <Text />
          ) : (
            <RemainingTime
              remainingSeconds={remainingSeconds}
              justifySelf="start"
            />
          )}
          <Flex justifySelf="center" opacity={ready ? 1 : 0}>
            {range(activities.length).map((idx) => (
              <Box
                key={idx}
                w="14px"
                h="14px"
                ml={idx === 0 ? 0 : '8px'}
                borderRadius="full"
                borderWidth={idx === page ? '7px' : '3px'}
                borderColor={
                  colorMode === 'dark' ? 'primary.200' : 'primary.600'
                }
                transitionProperty="border-width, background"
                transitionDuration="200ms"
                // Hack: fill in subpixel-sized center dot in Android Chrome
                // (probably due to a rounding error when sizing the border)
                bg={
                  idx === page
                    ? colorMode === 'dark'
                      ? 'primary.200'
                      : 'primary.600'
                    : 'transparent'
                }
                transitionDelay={idx === page ? '0s, 200ms' : '0s'}
                // TODO: a11y
                onClick={() => {
                  setPage(idx)
                }}
              />
            ))}
            {range(activities.length, lastPage + 1).map((idx) => (
              <MotionBox
                key={`manual-${idx === lastPage ? 'last' : idx}`}
                h="14px"
                color={colorMode === 'dark' ? 'primary.200' : 'primary.600'}
                style={
                  idx === lastPage
                    ? {
                        width: manualDraftPipWidth,
                        opacity: manualDraftPipOpacity,
                      }
                    : { width: '22px', opacity: idx === page ? 1 : 0.5 }
                }
                initial={false}
                animate={
                  idx === lastPage ? {} : { opacity: idx === page ? 1 : 0.5 }
                }
                overflow="visible"
                onClick={handleCreateManualEntry}
              >
                <Icon as={MdAdd} fontSize="20px" ml="5px" mt="-3px" />
              </MotionBox>
            ))}
          </Flex>
          <IconButton
            zIndex="overlay"
            icon={<MdArticle />}
            aria-label="View log"
            justifySelf="end"
            variant={isShowingLog ? 'solid' : 'ghost'}
            fontSize="3xl"
            onClick={() => {
              setShowingLog(!isShowingLog)
            }}
            borderRadius="full"
            size="lg"
            mr="-2"
            {...logLongPressProps}
          />
        </SimpleGrid>
      </VStack>
      <MotionBox
        position="absolute"
        left="0"
        top="0"
        w="full"
        h="full"
        bg={colorMode === 'dark' ? 'primary.800' : 'primary.50'}
        boxShadow={isShowingLog ? 'dark-lg' : 'none'}
        animate={{ y: isShowingLog ? 0 : '101vh' }}
        transition={{
          type: 'spring',
          duration: 0.35,
          bounce: 0,
        }}
        initial={false}
      >
        <Log onShowAbout={showIntro} />
      </MotionBox>
    </>
  )
}

export default App
