import { BoxProps, Flex, Text, useColorMode } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'
import { useAtom, useAtomValue } from 'jotai'
import { useMemo } from 'react'
import MotionBox from './MotionBox'
import {
  endTimeAtom,
  pageVisibleIdxAtom,
  remainingSecondsAtom,
} from './useActivities'

export default function RemainingTime({
  remainingSeconds,
  ...props
}: { remainingSeconds: number } & BoxProps) {
  const { colorMode } = useColorMode()
  const endTime = useAtomValue(endTimeAtom)
  const pageVisibleIdx = useAtomValue(pageVisibleIdxAtom)

  const remainingMinutes = Math.ceil(remainingSeconds / 60)

  const nowSeconds = Math.ceil(Date.now() / 1000)
  let pulseKey = 0
  if (remainingSeconds <= 10) {
    pulseKey = nowSeconds
  } else if (remainingSeconds <= 60) {
    pulseKey = endTime - Math.ceil(remainingSeconds / 10) * 10
  } else if (remainingMinutes <= 3) {
    pulseKey = endTime - remainingMinutes * 60
  }

  const pulse = useMemo(
    () => (
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
    ),
    [colorMode, pulseKey],
  )

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
      {/* Change the key of the AnimatePresence to clear out old pulses when the page is hidden. */}
      <AnimatePresence key={pageVisibleIdx}>{pulse}</AnimatePresence>
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
