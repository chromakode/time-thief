import { Box, Flex, FlexProps, Icon, useColorMode } from '@chakra-ui/react'
import { MotionValue, useTransform } from 'framer-motion'
import { range } from 'lodash'
import { MdAdd } from 'react-icons/md'
import MotionBox from './MotionBox'

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
  const { colorMode } = useColorMode()
  const manualDraftPipWidth = useTransform(
    dragProgressMotionValue,
    [0, 1],
    [0, 14 + 8],
  )
  return (
    <Flex justifySelf="center" {...props}>
      {range(activityCount).map((idx) => (
        <Box
          key={idx}
          w="14px"
          h="14px"
          ml={idx === 0 ? 0 : '8px'}
          borderRadius="full"
          borderWidth={idx === page ? '7px' : '3px'}
          borderColor={colorMode === 'dark' ? 'primary.200' : 'primary.600'}
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
            onGotoPage(idx)
          }}
        />
      ))}
      {range(activityCount, lastPage + 1).map((idx) => (
        <MotionBox
          key={`manual-${idx === lastPage ? 'last' : idx}`}
          h="14px"
          color={colorMode === 'dark' ? 'primary.200' : 'primary.600'}
          style={
            idx === lastPage
              ? {
                  width: manualDraftPipWidth,
                  opacity: dragProgressMotionValue,
                }
              : { width: '22px', opacity: idx === page ? 1 : 0.5 }
          }
          initial={false}
          animate={idx === lastPage ? {} : { opacity: idx === page ? 1 : 0.5 }}
          overflow="visible"
          onClick={onCreateManualEntity}
        >
          <Icon as={MdAdd} fontSize="20px" ml="5px" mt="-3px" />
        </MotionBox>
      ))}
    </Flex>
  )
}
