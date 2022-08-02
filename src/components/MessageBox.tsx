import {
  Box,
  Center,
  Flex,
  IconButton,
  Portal,
  useColorMode,
} from '@chakra-ui/react'
import useSize from '@react-hook/size'
import { useMotionValue } from 'framer-motion'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { MdNavigateNext } from 'react-icons/md'
import Carousel from './Carousel'
import MotionBox from './MotionBox'

const MESSAGE_HEIGHT = 175

export default function MessageBox({
  isModal,
  onPageChange,
  onFinish,
  children,
}: {
  isModal?: boolean
  onPageChange?: (nextPage: number) => void
  onFinish?: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { colorMode } = useColorMode()
  const [width = 0] = useSize(ref)
  const [page, setPage] = useState(0)
  const dragMotionValue = useMotionValue(0)

  const filteredChildren = React.Children.toArray(children).filter((x) => x)
  const pageCount = filteredChildren.length

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage)
      onPageChange?.(nextPage)
    },
    [onPageChange],
  )

  const handleNext = useCallback(() => {
    if (page === pageCount - 1) {
      onFinish?.()
    } else {
      setPage(page + 1)
      onPageChange?.(page + 1)
    }
  }, [onFinish, onPageChange, page, pageCount])

  useEffect(() => {
    if (page === pageCount) {
      onFinish?.()
    }
  }, [onFinish, page, pageCount])

  const transition = { type: 'string', duration: 0.4 }

  return (
    <>
      {isModal && (
        <Portal>
          <MotionBox
            position="absolute"
            inset="0"
            bg={colorMode === 'dark' ? 'primary.800' : 'primary.50'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            transition={transition}
            pointerEvents="none"
            zIndex="overlay"
          />
        </Portal>
      )}
      <MotionBox
        w="full"
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: MESSAGE_HEIGHT,
          opacity: 1,
        }}
        exit={{ height: 0, opacity: 0 }}
        transition={transition}
        bg={colorMode === 'dark' ? 'primary.800' : 'primary.50'}
        zIndex="popover"
      >
        <Flex h={`${MESSAGE_HEIGHT}`} w="full" flexDir="column" p="3" pt="0">
          <Flex
            h="full"
            borderColor="primary.600"
            borderWidth="6px"
            borderStyle="double"
            borderRadius="lg"
            position="relative"
            onClick={handleNext}
          >
            <Flex ref={ref} w="full" h="full" overflow="hidden">
              <IconButton
                onClick={handleNext}
                position="absolute"
                bottom="4px"
                right="4px"
                icon={
                  <MotionBox
                    variants={{
                      xBounce: {
                        x: [-2, 2],
                        transition: {
                          repeat: Infinity,
                          repeatType: 'mirror',
                          duration: 0.5,
                        },
                      },
                      yBounce: {
                        y: [-2, 2],
                        transition: {
                          repeat: Infinity,
                          repeatType: 'mirror',
                          duration: 0.5,
                        },
                      },
                      last: {
                        rotate: '90deg',
                      },
                    }}
                    animate={
                      page >= pageCount - 1
                        ? ['last', 'yBounce']
                        : ['next', 'xBounce']
                    }
                    zIndex="overlay"
                  >
                    <MdNavigateNext />
                  </MotionBox>
                }
                fontSize="2xl"
                size="sm"
                aria-label="Next"
                variant="ghost"
              />
              {width > 0 && (
                <Carousel
                  width={width}
                  page={page}
                  onPageChange={handlePageChange}
                  dragMotionValue={dragMotionValue}
                >
                  {filteredChildren.map((child) => (
                    <Center w={width} flexShrink="0" px="4">
                      {child}
                    </Center>
                  ))}
                  <Box />
                </Carousel>
              )}
            </Flex>
          </Flex>
        </Flex>
      </MotionBox>
    </>
  )
}
