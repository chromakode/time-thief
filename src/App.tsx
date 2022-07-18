import {
  BoxProps,
  Flex,
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
  useAnimation,
  useDragControls,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import { reduce } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MdArticle } from 'react-icons/md'
import { useFind } from 'use-pouchdb'
import Activities, { ActivityDefinition } from './Activities'
import activityData from './activities.json'
import './App.css'
import Activity from './components/Activity'
import ActivityPips from './components/ActivityPips'
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
      const url = new URL(window.location.href)
      if (newShowingLog) {
        url.pathname = 'log'
        pushURL(url.toString())
      } else {
        url.pathname = ''
        replaceURL(url.toString())
      }
    },
    [pushURL, replaceURL],
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
  const [width = 0, height = 0] = useSize(ref)
  const { isShowingIntro, showIntro } = useShowingIntro()

  const pageCount = activities.length + manualEntityIds.length
  const lastPage = pageCount - (manualEntityDraftId ? 1 : 0)
  const { page, setPage, isShowingLog, setShowingLog } = useRouter({
    maxPages: pageCount,
  })

  const dragControls = useDragControls()
  const dragMotionValue = useMotionValue(0)
  const dragDraftRange = [-(lastPage - 1) * width, -lastPage * width]
  const dragProgressMotionValue = useTransform(
    dragMotionValue,
    dragDraftRange,
    [0, 1],
  )

  const dragLogControls = useDragControls()
  const slideLog = useAnimation()
  const [isDraggingLog, setDraggingLog] = useState(false)

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

  function handleStartLogDrag(event: React.TouchEvent) {
    dragLogControls.start(event)
  }

  function handlePageChange(page: number) {
    setPage(page)
    blur()
    if (page < pageCount - 1) {
      cleanupManualDraft()
    }
  }

  function handleCreateManualEntity() {
    createManualDraft()
    setPage(page + 1)
  }

  useEffect(() => {
    slideLog.start(isShowingLog ? 'open' : 'closed')
  }, [isShowingLog, slideLog])

  const ready = width !== 0 && seed && manualEntitiesLoaded

  const activityContent = useMemo(
    () => [
      ...activities.map((activity, idx) => (
        <Activity
          w={width}
          key={`${seed}-${idx}-${activity.id}`}
          activity={activity}
          seed={seed}
          idx={idx}
        />
      )),
      ...manualEntityIds.map((id) => (
        <Activity
          w={width}
          key={id}
          activity={manualActivity}
          seed={seed}
          idx={parseIdxFromEntityId(id)}
        />
      )),
    ],
    [activities, manualActivity, manualEntityIds, seed, width],
  )

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
      >
        <Flex
          flex="1"
          w="full"
          position="relative"
          onTouchStart={handleStartDrag}
        >
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
                  onDragToLastPage={handleCreateManualEntity}
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
                  {activityContent}
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
          onTouchStart={handleStartLogDrag}
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
          <ActivityPips
            activityCount={activities.length}
            page={page}
            lastPage={lastPage}
            opacity={ready ? 1 : 0}
            dragProgressMotionValue={dragProgressMotionValue}
            onGotoPage={setPage}
            onCreateManualEntity={handleCreateManualEntity}
          />
          <IconButton
            zIndex="overlay"
            icon={<MdArticle />}
            aria-label="View log"
            justifySelf="end"
            variant={isShowingLog || isDraggingLog ? 'solid' : 'ghost'}
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
      {ready && (
        <MotionBox
          position="absolute"
          top="0"
          left="0"
          w="full"
          h="full"
          bg={colorMode === 'dark' ? 'primary.800' : 'primary.50'}
          boxShadow="dark-lg"
          drag="y"
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: height + 10 }}
          dragControls={dragLogControls}
          transition={{
            y: { type: 'spring', duration: 0.5, bounce: 0 },
          }}
          variants={{ open: { y: 0 }, closed: { y: height + 10 } }}
          animate={slideLog}
          initial={isShowingLog ? 'open' : 'closed'}
          onDirectionLock={(axis) => {
            if (axis === 'y') {
              setDraggingLog(true)
            }
          }}
          onDragEnd={(ev, { offset, velocity }) => {
            const velocityThreshold = 5000
            const threshold = 30
            const swipe = Math.abs(offset.y) * velocity.y

            let showingLog = isShowingLog
            if (swipe < -velocityThreshold || offset.y < -threshold) {
              showingLog = true
            } else if (swipe > velocityThreshold || offset.y > 0) {
              showingLog = false
            }

            slideLog.start(showingLog ? 'open' : 'closed')
            setShowingLog(showingLog)
            setDraggingLog(false)
          }}
        >
          <Log onShowAbout={showIntro} />
        </MotionBox>
      )}
    </>
  )
}

export default App
