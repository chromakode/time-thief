import { extendTheme, withDefaultColorScheme } from '@chakra-ui/react'

const theme = extendTheme(withDefaultColorScheme({ colorScheme: 'primary' }), {
  config: {
    useSystemColorMode: false,
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
    global: {
      'html, body, #root': {
        background: 'primary.50',
        color: 'primary.600',
        height: '100%',
      },
    },
  },
  textStyles: {
    title: {
      fontWeight: 600,
      fontStretch: '70%',
      fontVariationSettings: '"GRAD" -18',
      textAlign: 'center',
    },
  },
  components: {
    Textarea: {
      variants: {
        filled: {
          bg: 'rgba(0, 0, 0, .04)',
          _hover: {
            bg: 'rgba(0, 0, 0, .04)',
          },
        },
      },
      defaultProps: {
        focusBorderColor: 'primary.600',
      },
    },
  },
})

export default theme
