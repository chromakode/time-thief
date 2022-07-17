import { HStack } from '@chakra-ui/react'
import usePrevious from '@react-hook/previous'
import { DragControls, useAnimation } from 'framer-motion'
import React, { useEffect } from 'react'
import MotionBox from './MotionBox'

export default function Carousel({
  width,
  page,
  dragControls,
  onPageChange,
  onDragToLastPage,
  lastPage,
  children,
}: {
  width: number
  page: number
  dragControls: DragControls
  onPageChange: (page: number) => void
  onDragToLastPage: () => void
  lastPage?: React.ReactNode
  children: React.ReactNode
}) {
  const slidePage = useAnimation()
  const previousPage = usePrevious(page)
  const previousWidth = usePrevious(width)

  const pageCount = React.Children.count(children)
  const canMoveLeft = page > 0
  const canMoveRight = page < pageCount - 1
  const baseOffset = -page * width

  useEffect(() => {
    if (page === previousPage && width === previousWidth) {
      return
    }
    const method =
      previousPage === undefined || width !== previousWidth ? 'set' : 'start'
    slidePage[method]({ x: -page * width })
  }, [slidePage, page, previousPage, width, previousWidth])

  // FIXME: ignore multiple touch drags
  // TODO: ARIA tabs accessibility
  return (
    <MotionBox
      animate={slidePage}
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
      }}
      drag="x"
      dragConstraints={{
        left: baseOffset + (canMoveRight ? -width : 0),
        right: baseOffset + (canMoveLeft ? width : 0),
      }}
      dragElastic={lastPage && !canMoveRight ? 0.5 : 0.15}
      dragMomentum={false}
      dragDirectionLock
      dragControls={dragControls}
      onDragEnd={(ev, { point, offset, velocity }) => {
        const velocityThreshold = 5000
        const posThreshold = width / 3
        const swipe = Math.abs(offset.x) * velocity.x

        // If the user drags down, an onDragEnd is triggered with a
        // spurious offset = point. Framer bug? Seems detectable because
        // point.x = 0 in such cases.
        const movingRight =
          swipe < -velocityThreshold ||
          (point.x !== 0 && offset.x < -posThreshold)
        const movingLeft =
          swipe > velocityThreshold ||
          (point.x !== 0 && offset.x > posThreshold)

        if (movingRight && !canMoveRight && lastPage) {
          onDragToLastPage()
          return
        }

        let newPage = page
        if (movingRight) {
          newPage++
        } else if (movingLeft && canMoveLeft) {
          newPage--
        }
        slidePage.start({ x: -newPage * width })
        onPageChange(newPage)
      }}
    >
      <HStack h="full" spacing={0}>
        {children}
        {lastPage}
      </HStack>
    </MotionBox>
  )
}
