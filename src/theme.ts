import { extendTheme, withDefaultColorScheme } from '@chakra-ui/react'
import { StyleFunctionProps } from '@chakra-ui/theme-tools'

const theme = extendTheme(withDefaultColorScheme({ colorScheme: 'primary' }), {
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
  colors: {
    primary: {
      25: '#fff5f8',
      50: '#ffe8ef',
      100: '#f0c3cf',
      200: '#e39cb2',
      300: '#d67696',
      400: '#c94f7c',
      500: '#b03667',
      600: '#892953',
      700: '#631c36',
      800: '#3d101e',
      900: '#1b0209',
    },
  },
  fonts: {
    body: 'Roboto FlexVariable',
    heading: 'Roboto FlexVariable',
  },
  styles: {
    global: ({ colorMode }: StyleFunctionProps) => ({
      'html, body, #root': {
        background: colorMode === 'dark' ? 'primary.800' : 'primary.50',
        color: colorMode === 'dark' ? 'primary.100' : 'primary.600',
        height: '100%',
        overflow: 'hidden',
      },
    }),
  },
  textStyles: {
    title: {
      fontWeight: 600,
      fontStretch: '70%',
      fontVariationSettings: '"GRAD" -18',
      textAlign: 'center',
    },
    brand: {
      fontWeight: 650,
      fontVariationSettings: '"GRAD" 150, "slnt" -8, "YOPQ" 40',
      textTransform: 'capitalize',
    },
    brandStraight: {
      fontWeight: 650,
      fontVariationSettings: '"GRAD" 150, "YOPQ" 40',
      textTransform: 'capitalize',
    },
  },
  components: {
    Textarea: {
      variants: {
        filled: ({ colorMode }: StyleFunctionProps) => ({
          bg:
            colorMode === 'dark'
              ? 'rgba(255, 255, 255, .06)'
              : 'rgba(0, 0, 0, .04)',
          _hover: {
            bg: null,
          },
        }),
      },
      defaultProps: {
        focusBorderColor: 'primary.600',
      },
    },
    Modal: {
      baseStyle: ({ colorMode }: StyleFunctionProps) => ({
        dialog: {
          bg: colorMode === 'dark' ? 'primary.8t 00' : 'white',
        },
      }),
    },
  },
})

export default theme
