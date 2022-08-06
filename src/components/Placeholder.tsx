import { chakra, useColorMode } from '@chakra-ui/react'
import React, { FunctionComponent } from 'react'
import { ComponentProps } from 'react'
import { ReactComponent as DeskDoodle } from '../art/desk-doodle.svg'
import { ReactComponent as BikeSelfieDoodle } from '../art/bike-selfie-doodle.svg'
import { ReactComponent as SelfPortraitDoodle } from '../art/self-portrait-doodle.svg'
import { ReactComponent as SomeoneWithDoodle } from '../art/someone-with-doodle.svg'
import { ReactComponent as SkyDoodle } from '../art/sky-doodle.svg'
import { ReactComponent as KawasakiRoseDoodle } from '../art/kawasaki-rose-doodle.svg'

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
}: ComponentProps<typeof SVG> & { type: keyof typeof placeholders }) {
  const { colorMode } = useColorMode()
  const img = placeholders[type]
  return img ? (
    <SVG
      color={colorMode === 'dark' ? 'primary.200' : 'primary.700'}
      {...props}
      sx={{
        path: {
          'stroke-width': '1.75px !important',
          'vector-effect': 'non-scaling-stroke !important',
        },
      }}
      as={img}
    />
  ) : (
    <></>
  )
}
