import { extendTheme, withDefaultColorScheme } from '@chakra-ui/react'
import { StyleFunctionProps } from '@chakra-ui/theme-tools'

export const baseTheme = extendTheme(
  withDefaultColorScheme({ colorScheme: 'primary' }),
  {
    styles: {
      global: {
        body: {
          fontSynthesis: 'none',
          WebkitTapHighlightColor: 'transparent',
        },
      },
    },
    config: {
      useSystemColorMode: true,
    },
    colors: {
      beige: '#f8efef',
      lightBeige: '#fefcfc',
      inverse: '#007140',
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
      slant: {
        fontVariationSettings: '"GRAD" 150, "slnt" -8',
      },
      hero: {
        letterSpacing: '-.05rem',
        fontWeight: 600,
        fontVariationSettings: '"GRAD" 75, "opsz" 28',
      },
    },
    sizes: {
      container: {
        lg: 'max(640px, 56.25vh)',
      },
    },
    components: {
      Button: {
        variants: {
          solid: ({ colorMode }: StyleFunctionProps) => ({
            bgColor: colorMode === 'dark' ? 'primary.200' : 'primary.600',
            color: colorMode === 'dark' ? 'primary.800' : 'primary.50',
          }),
        },
      },
      StackDivider: {
        baseStyle: ({ colorMode }: StyleFunctionProps) => ({
          color: colorMode === 'dark' ? 'primary.600' : 'primary.200',
        }),
      },
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
            bg: colorMode === 'dark' ? 'primary.800' : 'primary.50',
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
  },
)

export const appTheme = extendTheme(
  {
    styles: {
      global: ({ colorMode }: StyleFunctionProps) => ({
        html: {
          // Prevent iOS vert scroll when installed to home screen.
          position: 'fixed',
        },
        'html, body, #root': {
          // Black to prevent flashes of white when viewport resizes (e.g. fullscreen camera).
          background: 'black',
          color: colorMode === 'dark' ? 'primary.100' : 'primary.600',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
        },
      }),
    },
  },
  baseTheme,
)
