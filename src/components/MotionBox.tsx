import { BoxProps, Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion<Omit<BoxProps, 'transition' | 'onDragEnd'>>(Box)

export default MotionBox
