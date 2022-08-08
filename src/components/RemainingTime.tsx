import { BoxProps, Flex, Text, useColorMode } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'
import { remainingSecondsAtom } from '../useActivities'
import MotionBox from './MotionBox'

export default function RemainingTime({
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
            opacity: [0, 1, 0],
          }}
          transition={{ ease: 'easeOut', duration: 1.75 }}
        />
      </AnimatePresence>
    </Flex>
  )
}

export function ActivityRemainingTime(props: BoxProps) {
  const [remainingSeconds] = useAtom(remainingSecondsAtom)
  if (remainingSeconds === null) {
    return <Text />
  }
  return <RemainingTime remainingSeconds={remainingSeconds} {...props} />
}
