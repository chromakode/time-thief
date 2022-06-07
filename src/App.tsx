import {
  Box,
  BoxProps,
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
import { useDragControls } from 'framer-motion'
import { range } from 'lodash'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { MdArticle } from 'react-icons/md'
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

function RemainingTime({
  remainingSeconds,
  ...props
}: { remainingSeconds: number } & BoxProps) {
  const remainingMinutes = Math.ceil(remainingSeconds / 60)
  return (
    <Text textStyle="title" {...props}>
      {remainingSeconds > 60 ? `${remainingMinutes}m` : `${remainingSeconds}s`}
    </Text>
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
  const { showingIntro, showIntro } = useShowingIntro()
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
        opacity={showingIntro ? '0' : '1'}
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
                borderWidth={idx === page ? '7px' : '3px'}
                borderColor={
                  colorMode === 'dark' ? 'primary.200' : 'primary.600'
                }
                transitionProperty="border"
                transitionDuration="200ms"
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
        {isShowingLog && <Log onShowAbout={showIntro} />}
      </MotionBox>
    </>
  )
}

export default App
