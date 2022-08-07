import { Box, BoxProps, chakra, useColorMode } from '@chakra-ui/react'
import React, { FunctionComponent, useRef } from 'react'
import { ReactComponent as DeskDoodle } from '../art/desk-doodle.svg'
import { ReactComponent as BikeSelfieDoodle } from '../art/bike-selfie-doodle.svg'
import { ReactComponent as SelfPortraitDoodle } from '../art/self-portrait-doodle.svg'
import { ReactComponent as SomeoneWithDoodle } from '../art/someone-with-doodle.svg'
import { ReactComponent as SkyDoodle } from '../art/sky-doodle.svg'
import { ReactComponent as KawasakiRoseDoodle } from '../art/kawasaki-rose-doodle.svg'
import useSize from '@react-hook/size'

const SVG = chakra('svg')

const placeholders: Record<string, FunctionComponent> = {
  'desk-doodle': DeskDoodle,
  'bike-selfie-doodle': BikeSelfieDoodle,
  'self-portrait-doodle': SelfPortraitDoodle,
  'someone-with-doodle': SomeoneWithDoodle,
  'sky-doodle': SkyDoodle,
  'kawasaki-rose-doodle': KawasakiRoseDoodle,
}

export default function Placeholder({
  type,
  ...props
}: BoxProps & { type: keyof typeof placeholders }) {
  const { colorMode } = useColorMode()
  const ref = useRef<HTMLDivElement>(null)
  const [width, height] = useSize(ref)

  const shouldShow = width > 200 && height > 200
  const img = placeholders[type]

  return (
    <Box ref={ref} {...props}>
      {img && (
        <SVG
          as={img}
          w="full"
          h="full"
          color={colorMode === 'dark' ? 'primary.200' : 'primary.700'}
          opacity={shouldShow ? 1 : 0}
          sx={{
            path: {
              'stroke-width': '1.75px !important',
              'vector-effect': 'non-scaling-stroke !important',
            },
          }}
        />
      )}
    </Box>
  )
}
