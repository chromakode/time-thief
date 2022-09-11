import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { useSetCustomData } from '../components/useActivityDB'
import { debounce } from 'lodash'
import { useCallback, useMemo, useRef, useState } from 'react'
import json5 from 'json5'
import { MdCheckCircle, MdRefresh, MdRemoveCircle } from 'react-icons/md'

const defaultSource = `
{
  "activities": [
    // Add your first custom activity:
    /*
    {
      "id": "journal-lunch",
      "conditions": {
        "frequency": "day"
      },
      "content": [
        {
          "type": "title",
          "text": "What did you have for lunch?"
        },
        {
          "type": "input/multi-line",
          "field": "content"
        }
      ],
      "entity": {
        "type": "journal"
      }
    },
    */

    // You can also disable existing ones:
    /*
    {
      "id": "selfie",
      "conditions": {
        "enabled": false
      }
    }
    */
  ],

  // Customize to fit your schedule:
  /*
  "config": {
    "timeNames": {
      "0": "sleep",
      "7": "morning",
      "12": "afternoon",
      "18": "evening",
      "21": "night"
    }
  },
  */
}
`.trim()

const examplesURL =
  'https://github.com/chromakode/time-thief/blob/main/src/activities.json'

export default function CustomActivitiesExperiment() {
  const { customDataSource, setCustomData } = useSetCustomData()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const origSource = useMemo(() => customDataSource, [customDataSource])

  const [parseError, setParseError] = useState<string>()
  const [reloadRequired, setReloadRequired] = useState(false)
  const sourceRef = useRef(defaultSource)

  const handleCodeChange = useMemo(
    () =>
      debounce(
        (source: string) => {
          sourceRef.current = source

          // TODO: validate against schema
          try {
            json5.parse(source)
          } catch (err: any) {
            setParseError(err.toString())
            return
          }
          setParseError(undefined)
          setReloadRequired(source !== origSource)
        },
        500,
        { leading: true },
      ),
    [origSource],
  )

  const handleApply = useCallback(() => {
    setCustomData(sourceRef.current)
    window.location.reload()
  }, [setCustomData])

  return (
    <VStack alignItems="flex-start" w="full">
      <Heading size="lg">Custom Prompts</Heading>
      <Flex flexDir="column" alignItems="stretch" w="full">
        <Text>
          Add custom prompts using{' '}
          <Text as="span" textStyle="brand">
            TIME THIEF
          </Text>
          's rules engine. View the{' '}
          <Link href={examplesURL} textDecoration="underline" isExternal>
            default activity list
          </Link>{' '}
          for samples.
        </Text>
        <Box
          position="relative"
          borderRadius="md"
          overflow="hidden"
          fontSize="sm"
          my="4"
          ml={{ base: '-8', md: '0' }}
          mr={{ base: '-8', md: '0' }}
        >
          <CodeMirror
            value={customDataSource ?? defaultSource}
            onChange={handleCodeChange}
            width="100%"
            height="70vh"
            extensions={[javascript(), EditorView.lineWrapping]}
            theme="dark"
            basicSetup={{
              foldGutter: false,
              autocompletion: false,
            }}
          />
          <Box
            bg="blackAlpha.700"
            fontSize="md"
            fontWeight="medium"
            position="absolute"
            bottom="0"
            right="6"
            py="1"
            px="1"
            borderTopLeftRadius="md"
            borderTopRightRadius="md"
            zIndex="overlay"
          >
            {parseError ? (
              <Text color="red" px="2">
                <Icon as={MdRemoveCircle} verticalAlign="middle" /> {parseError}
              </Text>
            ) : (
              <Text color="green">
                <HStack>
                  <HStack px="2">
                    <Icon as={MdCheckCircle} />
                    <Box>Ok</Box>
                  </HStack>
                  {reloadRequired && (
                    <Button
                      leftIcon={<MdRefresh />}
                      size="xs"
                      mt="2"
                      onClick={handleApply}
                    >
                      Reload to apply
                    </Button>
                  )}
                </HStack>
              </Text>
            )}
          </Box>
        </Box>
      </Flex>
    </VStack>
  )
}
