import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Box,
  HStack,
  Icon,
  Text,
  TextProps,
  useColorMode,
  useMediaQuery,
  useTimeout,
  VStack,
} from '@chakra-ui/react'
import { useAllDocs, useDoc, usePouch } from 'use-pouchdb'
import MessageBox from './MessageBox'
import { AnimatePresence } from 'framer-motion'
import MotionBox from './MotionBox'
import { MdArticle, MdFavorite, MdIosShare, MdMoreVert } from 'react-icons/md'
import RemainingTime from './RemainingTime'
import { useAtom } from 'jotai'
import { activityPageAtom, demoSwipeAtom, installPromptEventAtom } from '../App'
import { useLocation } from 'react-router-dom'
import Bowser from 'bowser'
import Markdown from './Markdown'

type NUXHook = () => ReactNode | undefined

function useNUXMessage(nuxHooks: NUXHook[]) {
  const results = nuxHooks.map((hook) => hook())
  return results.find((r) => r !== undefined)
}

function useNUXSeen(name: string, delay: number = 1000): [boolean, () => void] {
  const id = `$nux/${name}`

  const db = usePouch()
  const { doc, loading } = useDoc(id)

  const setSeen = React.useCallback(() => {
    db.put({ _id: id, seen: Date.now() })
  }, [db, id])

  // 1s initial delay
  const [ready, setReady] = useState(false)
  useTimeout(() => {
    setReady(true)
  }, delay)

  const isSeen = !ready || loading || doc != null

  return [isSeen, setSeen]
}

function useEntityCount() {
  const entities = useAllDocs({
    startkey: '0',
    endkey: '9\ufff0',
  })
  return entities.rows.length
}

function usePageChangeTrigger<T extends any[]>(
  predicate: (...args: T) => boolean,
  deps: T,
) {
  const [isEligible, setIsEligible] = useState(false)
  const [initialPage, setInitialPage] = useState<number | null>(null)

  const [currentPage] = useAtom(activityPageAtom)

  useEffect(() => {
    if (predicate(...deps)) {
      setInitialPage(currentPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, predicate, ...deps])

  useEffect(() => {
    if (initialPage !== null && currentPage !== initialPage) {
      setIsEligible(true)
    }
  }, [currentPage, initialPage])

  return isEligible
}

function MessageText({
  children,
  ...props
}: { children: ReactNode } & TextProps) {
  return (
    <Text fontSize="2xl" fontWeight="550" textAlign="center" {...props}>
      <Markdown>{children}</Markdown>
    </Text>
  )
}

function useNUXFirstTime() {
  const { colorMode } = useColorMode()

  const [isSeen, setSeen] = useNUXSeen('first-time')

  const [seconds, setSeconds] = useState(60)
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((secs) => (secs === 0 ? 60 : secs - 1))
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const [, setDemoSwipeValue] = useAtom(demoSwipeAtom)

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage === 1) {
        setDemoSwipeValue(true)
        return
      }

      if (nextPage === 2) {
        setSeconds(29)
      }

      setDemoSwipeValue(null)
    },
    [setDemoSwipeValue],
  )

  const handleFinish = useCallback(() => {
    // Ensure demo swiping is reset.
    setDemoSwipeValue(null)
    setSeen()
  }, [setDemoSwipeValue, setSeen])

  if (isSeen) {
    return
  }

  return (
    <MessageBox
      key="first-time"
      onPageChange={handlePageChange}
      onFinish={handleFinish}
      isModal
    >
      <VStack spacing="0">
        <MessageText>
          Hey, welcome to{' '}
          <Text as="span" textStyle="brand">
            TIME THIEF
          </Text>
          <Text as="span" textStyle="slant">
            !
          </Text>
        </MessageText>
        <MotionBox
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: 'auto',
            opacity: 1,
            transition: {
              type: 'spring',
              duration: 1,
              bounce: 0.4,
              delay: 2,
            },
          }}
        >
          <Text fontSize="lg">
            <Markdown>(swipe or tap to continue...)</Markdown>
          </Text>
        </MotionBox>
      </VStack>
      <MessageText>Swipe left and right to navigate.</MessageText>
      <VStack>
        <Box
          p="2"
          bg={colorMode === 'dark' ? 'primary.50' : 'primary.600'}
          color={colorMode === 'dark' ? 'primary.600' : 'primary.50'}
          borderRadius="full"
        >
          <RemainingTime remainingSeconds={seconds} />
        </Box>
        <MessageText>Every 15 minutes, you get 3 new prompts.</MessageText>
      </VStack>
      <HStack fontSize="xl" spacing="1">
        <MessageText>Don't overthink it! Just write.</MessageText>
        <MdFavorite />
      </HStack>
    </MessageBox>
  )
}

function useNUXFirstWritten() {
  const [isSeen, setSeen] = useNUXSeen('first-written')
  const [isLogSeen] = useNUXSeen('log-viewed')
  const entityCount = useEntityCount()

  const isEligible = usePageChangeTrigger(
    (isSeen, entityCount) => !isSeen && entityCount > 0,
    [isSeen, entityCount],
  )

  if (isSeen || !isEligible) {
    return
  }

  return (
    <MessageBox key="first-written" onFinish={setSeen}>
      <MessageText>Awesome, you wrote your first note!</MessageText>
      <VStack spacing="1">
        <MessageText>
          Everything is auto-saved privately on your device.
        </MessageText>
        <Text fontSize="lg">No internet required!</Text>
      </VStack>
      {!isLogSeen && (
        <MessageText>
          Tap the log
          <Icon
            as={MdArticle}
            display="inline-block"
            verticalAlign="text-bottom"
            fontSize="3xl"
            mx="2"
          />
          to reflect on your day.
        </MessageText>
      )}
    </MessageBox>
  )
}

function useNUXLogViewed() {
  const [isSeen, setSeen] = useNUXSeen('log-viewed')

  const location = useLocation()
  const isViewingLog = location.pathname === '/app/log'

  if (isSeen || !isViewingLog) {
    return
  }

  return (
    <MessageBox key="log-viewed" onFinish={setSeen}>
      <MessageText>This is your log.</MessageText>
      <MessageText>
        It displays everything you've written in{' '}
        <Text as="span" textStyle="brand">
          TIME THIEF
        </Text>
        .
      </MessageText>
      <MessageText>Except! There's a twist!</MessageText>
      <MessageText>
        The log doesn't show anything less than a day old.
      </MessageText>
      <MessageText>To help avoid dwelling on recent history...</MessageText>
      <MessageText>
        ... and to give you an extra reason to check back tomorrow.
      </MessageText>
      <MessageText>
        <Text as="span" textStyle="brand">
          TIME THIEF
        </Text>{' '}
        is all about making journaling a durable habit.
      </MessageText>
      <MessageText>Check back tomorrow and see what you find.</MessageText>
    </MessageBox>
  )
}

function useNUXHowToManual() {
  const [isSeen, setSeen] = useNUXSeen('how-to-manual')

  const entityCount = useEntityCount()
  const [currentPage] = useAtom(activityPageAtom)

  if (isSeen || entityCount < 1 || currentPage !== 2) {
    return
  }

  return (
    <MessageBox key="how-to-manual" onFinish={setSeen}>
      <MessageText>
        Got something else to say, or a photo you can't miss?
      </MessageText>
      <MessageText>
        Swipe left past the last prompt to add an extra page to your journal.
      </MessageText>
      <MessageText>You can add as many extra pages as you want.</MessageText>
    </MessageBox>
  )
}

function useNUXAboutPrompts() {
  const [isSeen, setSeen] = useNUXSeen('about-prompts')
  const entityCount = useEntityCount()

  const isEligible = usePageChangeTrigger(
    (isSeen, entityCount) => !isSeen && entityCount > 3,
    [isSeen, entityCount],
  )

  if (isSeen || !isEligible) {
    return
  }

  return (
    <MessageBox key="about-prompts" onFinish={setSeen}>
      <MessageText>
        By the way, prompts are just a starting point for inspiration.
      </MessageText>
      <MessageText>
        You're encouraged to reinterpret them or take a contrarian stance.
      </MessageText>
      <MessageText>
        If you're not feeling any of them, don't sweat it -- you can always
        write more later.
      </MessageText>
    </MessageBox>
  )
}

function useNUXHowToInstall() {
  const [isSeen, setSeen] = useNUXSeen('how-to-install')
  const entityCount = useEntityCount()

  const isInstalled = !useMediaQuery('display-mode: browser')

  const [installPromptEvent] = useAtom(installPromptEventAtom)

  const browser = useMemo(() => Bowser.getParser(navigator.userAgent), [])
  const osName = browser.getOSName(true)
  const isTablet = browser.getPlatformType(true) === 'tablet'
  const canInstall =
    installPromptEvent || osName === 'ios' || osName === 'android'

  const isEligible = usePageChangeTrigger(
    (isSeen, entityCount) => !isSeen && entityCount > 1,
    [isSeen, entityCount],
  )

  const handleFinish = useCallback(() => {
    installPromptEvent?.prompt()
    setSeen()
  }, [installPromptEvent, setSeen])

  if (isSeen || isInstalled || !canInstall || !isEligible) {
    return
  }

  return (
    <MessageBox key="how-to-install" onFinish={handleFinish}>
      <MessageText>
        The easier it is to open your journal, the better{' '}
        <Text as="span" textStyle="brand">
          TIME THIEF
        </Text>{' '}
        works.
      </MessageText>
      {installPromptEvent && (
        <MessageText>
          Would you like to add{' '}
          <Text as="span" textStyle="brand">
            TIME THIEF
          </Text>{' '}
          to your home screen?
        </MessageText>
      )}
      {osName === 'ios' && (
        <MessageText>
          {`To add it to your ${isTablet ? 'iPad' : 'iPhone'}, tap`}
          <Icon
            as={MdIosShare}
            display="inline-block"
            verticalAlign="text-bottom"
            fontSize="3xl"
            mx="2"
          />
          and "Add to Home Screen"
        </MessageText>
      )}
      {osName === 'android' && (
        <MessageText>
          {`To add it to your Android ${
            isTablet ? 'tablet' : 'phone'
          }, tap the `}{' '}
          <Icon
            as={MdMoreVert}
            display="inline-block"
            verticalAlign="text-bottom"
            fontSize="3xl"
          />{' '}
          menu and "Install app"
        </MessageText>
      )}
    </MessageBox>
  )
}

export default function NUXMessage() {
  const content = useNUXMessage([
    useNUXFirstTime,
    useNUXFirstWritten,
    useNUXLogViewed,
    useNUXHowToManual,
    useNUXAboutPrompts,
    useNUXHowToInstall,
  ])
  return <AnimatePresence>{content}</AnimatePresence>
}
