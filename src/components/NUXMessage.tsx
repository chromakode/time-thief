import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import {
  Box,
  Center,
  HStack,
  Text,
  TextProps,
  useColorMode,
  useTimeout,
  VStack,
} from '@chakra-ui/react'
import { useDoc, usePouch } from 'use-pouchdb'
import MessageBox from './MessageBox'
import { AnimatePresence } from 'framer-motion'
import MotionBox from './MotionBox'
import { MdFavorite } from 'react-icons/md'
import RemainingTime from './RemainingTime'
import { useAtom } from 'jotai'
import { demoSwipe } from '../App'

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

function MessageText({
  children,
  ...props
}: { children: ReactNode } & TextProps) {
  return (
    <Text fontSize="2xl" fontWeight="550" textAlign="center" {...props}>
      {children}
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

  const [, setDemoSwipeValue] = useAtom(demoSwipe)

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
    <MessageBox onPageChange={handlePageChange} onFinish={handleFinish} isModal>
      <Center flexDir="column">
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
          <Text fontSize="lg">(swipe or tap to continue...)</Text>
        </MotionBox>
      </Center>
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
        <MessageText>Don't overthink it! Just write</MessageText>
        <MdFavorite />
      </HStack>
    </MessageBox>
  )
}

export default function NUXMessage() {
  const content = useNUXMessage([useNUXFirstTime])
  return <AnimatePresence>{content}</AnimatePresence>
}
