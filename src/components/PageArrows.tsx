import { IconButton, useBreakpointValue } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'
import { MdAdd, MdArrowBack, MdArrowForward } from 'react-icons/md'
import MotionBox from './MotionBox'

export default function PageArrows({
  page,
  pageCount,
  prevPage,
  nextPage,
}: {
  page: number
  pageCount: number
  prevPage: () => void
  nextPage: () => void
}) {
  const show = useBreakpointValue({
    base: false,
    md: true,
  })

  return (
    <AnimatePresence initial={false}>
      {show && (
        <MotionBox
          key="back-arrow"
          position="absolute"
          left="8"
          top="50%"
          transform="translateY(-50%)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <IconButton
            icon={<MdArrowBack />}
            aria-label="Previous prompt"
            fontSize="3xl"
            onClick={prevPage}
            borderRadius="full"
            size="lg"
            disabled={page === 0}
          />
        </MotionBox>
      )}
      {show && (
        <MotionBox
          key="forward-arrow"
          position="absolute"
          right="8"
          top="50%"
          transform="translateY(-50%)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <IconButton
            icon={page === pageCount - 1 ? <MdAdd /> : <MdArrowForward />}
            aria-label="Previous prompt"
            fontSize="3xl"
            onClick={nextPage}
            borderRadius="full"
            size="lg"
            disabled={page === pageCount}
          />
        </MotionBox>
      )}
    </AnimatePresence>
  )
}
