import { extendTheme, withDefaultColorScheme } from '@chakra-ui/react'
import { StyleFunctionProps } from '@chakra-ui/theme-tools'

const theme = extendTheme(withDefaultColorScheme({ colorScheme: 'primary' }), {
  config: {
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
      html: {
        // Prevent iOS vert scroll when installed to home screen.
        position: 'fixed',
      },
      body: {
        WebkitTapHighlightColor: 'transparent',
        fontSynthesis: 'none',
      },
      'html, body, #root': {
        // Black to prevent flashes of white when viewport resizes (e.g. fullscreen camera).
        background: 'black',
        color: colorMode === 'dark' ? 'primary.100' : 'primary.600',
        height: '100%',
        overflow: 'hidden',
      },
      '#root': {
        background: colorMode === 'dark' ? 'primary.800' : 'primary.50',
      },
    }),
  },
  textStyles: {
    title: {
      fontWeight: 600,
      fontStretch: '70%',
      fontVariationSettings: '"GRAD" -18',
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
    Input: {
      variants: {
        filled: ({ colorMode }: StyleFunctionProps) => ({
          field: {
            bg:
              colorMode === 'dark'
                ? 'rgba(255, 255, 255, .06)'
                : 'rgba(0, 0, 0, .04)',
            _hover: {
              bg: null,
            },
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
          bg: colorMode === 'dark' ? 'primary.800' : 'white',
        },
      }),
    },
    Menu: {
      variants: {
        logActions: ({ colorMode }: StyleFunctionProps) => ({
          list: {
            py: 0,
            bg: colorMode === 'dark' ? 'primary.700' : 'primary.100',
            borderWidth: 0,
            boxShadow: 'none',
          },
          item: {
            fontWeight: 'medium',
            bg: 'transparent',
            px: '.5rem',
            py: 0,
            _focus: {
              bg: 'transparent',
            },
            _active: {
              bg: 'transparent',
            },
          },
        }),
      },
    },
  },
})

export default theme
