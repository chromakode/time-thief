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

function useLongPress(onLongPress: () => void, duration = 5000) {
  const timeoutRef = useRef<number | undefined>()
  const callbackRef = useRef<() => void>(onLongPress)

  callbackRef.current = onLongPress

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const onPointerDown = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      callbackRef.current()
    }, duration)
  }, [duration])

  const onPointerUp = useCallback(() => {
    window.clearTimeout(timeoutRef.current)
  }, [])

  return { onPointerDown, onPointerUp }
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

function App() {
  const { colorMode } = useColorMode()
  const [{ activities, seed }, remainingSeconds] = useActivities()
  const ref = useRef<HTMLDivElement>(null)
  const [width = 0] = useSize(ref)
  const [page, setPage] = useState(0)
  const dragControls = useDragControls()
  const [showingLog, setShowingLog] = useState(false)
  const { showingIntro } = useShowingIntro()

  const logLongPressProps = useLongPress(() => {
    localStorage['syncEndpoint'] = window.prompt('sync endpoint')
  })

  function handleStartDrag(event: React.TouchEvent) {
    dragControls.start(event)
  }

  function handlePageChange(page: number) {
    setPage(page)
    blur()
  }

  function blur() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  useEffect(() => {
    setPage(0)
    blur()
  }, [seed])

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
            zIndex={100}
            icon={<MdArticle />}
            aria-label="View log"
            justifySelf="end"
            variant={showingLog ? 'solid' : 'ghost'}
            fontSize="3xl"
            onClick={() => {
              setShowingLog(!showingLog)
            }}
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
        boxShadow={showingLog ? 'dark-lg' : 'none'}
        animate={{ y: showingLog ? 0 : '101vh' }}
        transition={{ type: 'tween', duration: 0.25 }}
        initial={false}
      >
        {showingLog && <Log />}
      </MotionBox>
    </>
  )
}

export default App
