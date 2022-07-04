import {
  Box,
  BoxProps,
  Flex,
  HStack,
  IconButton,
  SimpleGrid,
  Text,
  useColorMode,
  VStack,
} from '@chakra-ui/react'
import '@fontsource/roboto-flex/variable-full.css'
import useSize from '@react-hook/size'
import 'focus-visible/dist/focus-visible'
import { AnimatePresence, useDragControls } from 'framer-motion'
import { range, reduce } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MdArticle } from 'react-icons/md'
import { useFind } from 'use-pouchdb'
import Activities, { ActivityDefinition } from './Activities'
import activityData from './activities.json'
import './App.css'
import Activity from './components/Activity'
import Carousel from './components/Carousel'
import { IntroModal, useShowingIntro } from './components/IntroModal'
import Log from './components/Log'
import MotionBox from './components/MotionBox'
import useLocationURL from './utils/useLocationURL'
import useLongPress from './utils/useLongPress'

interface ActivityState {
  activities: Array<ActivityDefinition>
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
  const [{ activities, seed }, remainingSeconds] = useActivities()
  const ref = useRef<HTMLDivElement>(null)
  const [width = 0] = useSize(ref)
  const dragControls = useDragControls()
  const { isShowingIntro, showIntro } = useShowingIntro()
  const { page, setPage, isShowingLog, setShowingLog } = useRouter({
    maxPages: activities.length,
  })

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
  }

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
        {width !== 0 && (
          <Carousel
            width={width}
            page={page}
            onPageChange={handlePageChange}
            dragControls={dragControls}
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
          </Carousel>
        )}
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
          <HStack justifySelf="center">
            {range(activities.length).map((idx) => (
              <Box
                key={idx}
                w="14px"
                h="14px"
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
          </HStack>
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
        transition={{ type: 'tween', duration: 0.25 }}
        initial={false}
      >
        <Log onShowAbout={showIntro} />
      </MotionBox>
    </>
  )
}

export default App
