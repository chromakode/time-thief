import { Box, Flex, FlexProps, useColorMode, useToken } from '@chakra-ui/react'
import { motion, MotionValue, useTransform } from 'framer-motion'
import { range } from 'lodash'
import { useMemo } from 'react'
import MotionBox from './MotionBox'

const SIZE = 14
const HALF_SIZE = SIZE / 2
const SPACING = 8

function CirclePip({
  isFirst,
  isSelected,
  onClick,
}: {
  isFirst: boolean
  isSelected: boolean
  onClick: () => void
}) {
  const { colorMode } = useColorMode()
  return (
    <Box
      w={`${SIZE}px`}
      h={`${SIZE}px`}
      ml={isFirst ? 0 : `${SPACING}px`}
      borderRadius="full"
      borderWidth={isSelected ? `${HALF_SIZE}px` : '3px'}
      borderColor={colorMode === 'dark' ? 'primary.200' : 'primary.600'}
      transitionProperty="border-width, background"
      transitionDuration="200ms"
      // Hack: fill in subpixel-sized center dot in Android Chrome
      // (probably due to a rounding error when sizing the border)
      bg={
        isSelected
          ? colorMode === 'dark'
            ? 'primary.200'
            : 'primary.600'
          : 'transparent'
      }
      transitionDelay={isSelected ? '0s, 200ms' : '0s'}
      // TODO: a11y
      onClick={onClick}
    />
  )
}

function PlusPip({
  isLast,
  isSelected,
  dragProgressMotionValue,
  onClick,
}: {
  isLast: boolean
  isSelected: boolean
  dragProgressMotionValue: MotionValue
  onClick: () => void
}) {
  const normalWidth = 2
  const selectedWidth = 2.75
  const inset = 1.5
  const oversize = selectedWidth / 2

  const { colorMode } = useColorMode()
  const manualDraftPipWidth = useTransform(
    dragProgressMotionValue,
    [0, 1],
    [0, 14 + 8],
  )
  const strokeWidth = useTransform(
    dragProgressMotionValue,
    [0.5, 1],
    [normalWidth, selectedWidth],
  )
  const colorName = colorMode === 'dark' ? 'primary.200' : 'primary.600'
  const color = useToken('colors', colorName)

  const viewBox = [
    -oversize,
    -oversize,
    SIZE + 2 * oversize,
    SIZE + 2 * oversize,
  ].join(' ')
  const path = useMemo(
    () =>
      [
        `M ${HALF_SIZE} ${inset}`,
        `L ${HALF_SIZE} ${SIZE - inset}`,
        `M ${inset} ${HALF_SIZE}`,
        `L ${SIZE - inset} ${HALF_SIZE}`,
      ].join(' '),
    [],
  )

  return (
    <MotionBox
      h={`${SIZE}px`}
      style={
        isLast
          ? {
              width: manualDraftPipWidth,
              opacity: dragProgressMotionValue,
            }
          : { width: `${SIZE + SPACING}px`, opacity: isSelected ? 1 : 0.5 }
      }
      initial={false}
      animate={isLast ? {} : { opacity: isSelected ? 1 : 0.5 }}
      onClick={onClick}
    >
      <svg
        width={`${SIZE + 2 * oversize}px`}
        height={`${SIZE + 2 * oversize}px`}
        viewBox={viewBox}
        style={{
          marginLeft: `${SPACING - oversize}px`,
          marginTop: `${-oversize}px`,
        }}
      >
        <motion.path
          d={path}
          style={isLast ? { strokeWidth } : {}}
          initial={false}
          animate={
            isLast
              ? {}
              : { strokeWidth: isSelected ? selectedWidth : normalWidth }
          }
          stroke={color}
          strokeLinecap="round"
        />
      </svg>
    </MotionBox>
  )
}

export default function ActivityPips({
  activityCount,
  page,
  lastPage,
  dragProgressMotionValue,
  onGotoPage,
  onCreateManualEntity,
  ...props
}: {
  activityCount: number
  page: number
  lastPage: number
  dragProgressMotionValue: MotionValue
  onGotoPage: (page: number) => void
  onCreateManualEntity: () => void
} & FlexProps) {
  return (
    <Flex justifySelf="center" {...props}>
      {range(activityCount).map((idx) => (
        <CirclePip
          key={idx}
          isFirst={idx === 0}
          isSelected={idx === page}
          onClick={() => {
            onGotoPage(idx)
          }}
        />
      ))}
      {range(activityCount, lastPage + 1).map((idx) => (
        <PlusPip
          key={`manual-${idx === lastPage ? 'last' : idx}`}
          isLast={idx === lastPage}
          isSelected={idx === page}
          dragProgressMotionValue={dragProgressMotionValue}
          onClick={onCreateManualEntity}
        />
      ))}
    </Flex>
  )
}
