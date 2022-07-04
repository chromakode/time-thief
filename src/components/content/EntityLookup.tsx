import {
  Box,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  useColorMode,
  useRadio,
  useRadioGroup,
  VStack,
} from '@chakra-ui/react'
import { throttle } from 'lodash'
import {
  Ref,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { MdSearch } from 'react-icons/md'
import slugify from 'slugify'
import { useFind, usePouch } from 'use-pouchdb'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'

function EntityItem(props: any) {
  const { colorMode } = useColorMode()
  const { getInputProps, getCheckboxProps } = useRadio(props)

  return (
    <Box as="label" w="full">
      <input {...getInputProps()} />
      <Button
        as="div"
        {...getCheckboxProps()}
        size="lg"
        fontSize="2xl"
        variant="ghost"
        w="full"
        h="auto"
        py="2"
        whiteSpace="normal"
        overflowWrap="break-word"
        _checked={{
          bg:
            colorMode === 'dark'
              ? 'rgba(255, 255, 255, .12)'
              : 'rgba(0, 0, 0, .08)',
        }}
        _focus={{ boxShadow: 'none' }}
      >
        {props.children}
      </Button>
    </Box>
  )
}

function useOptions(filter: { field: string; type: string }, input: string) {
  const slug = slugify(input, { lower: true })
  const id = `${filter.type}:${slug}`
  const { docs } = useFind<any>({
    index: {
      fields: ['_id'],
    },
    selector: {
      type: filter.type,
      _id: {
        $gte: input.length ? id : '\uffff',
        $lte: id + '\uffff',
      },
    },
    sort: ['_id'],
    fields: ['_rev', '_id', filter.field],
  })

  const options = useMemo(() => {
    if (docs?.[0]?._id !== id) {
      return [
        {
          _id: id,
          type: filter.type,
          [filter.field]: input,
        },
        ...docs,
      ]
    }
    return docs
  }, [docs, filter.field, filter.type, id, input])

  return options
}

export default function EntityLookup(
  { spec, context, field, set, setContext }: ContentComponentProps,
  ref: Ref<ContentComponentRef>,
) {
  const db = usePouch()
  const [input, setInput] = useState(context[field]?._input ?? '')
  const [selectedId, setSelectedId] = useState(() => context[field]?._id)

  const handleChange = throttle((ev: React.ChangeEvent<HTMLInputElement>) => {
    setInput(ev.target.value)
  }, 100)

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'entity',
    value: selectedId,
    onChange: setSelectedId,
  })

  const { filter } = spec
  const options = useOptions(filter, input)
  const selectedEntity = options.find((o) => o._id === selectedId)

  useEffect(() => {
    setContext({
      [field]: { ...selectedEntity, _input: input, _valid: !!input.length },
    })
  }, [field, input, selectedEntity, set, setContext])

  // Auto select first available option
  useLayoutEffect(() => {
    if (!selectedEntity && options.length) {
      setSelectedId(options[0]._id)
    }
  }, [options, selectedEntity])

  useImperativeHandle(
    ref,
    () => ({
      finalize: () => {
        set({ [field]: selectedEntity._id })
        if (!selectedEntity._rev) {
          db.put(selectedEntity)
        }
      },
    }),
    [db, field, selectedEntity, set],
  )

  // todo: set value to function which when called finalizes entity or returns existing one
  // id is simple lowercase of filter field? allows case insensitive search, uniqueness, and readable ids

  return (
    <VStack px="4" w="full" flex="1" spacing="8">
      <InputGroup size="lg" h="16" w="full">
        <Input
          w="full"
          h="full"
          variant="filled"
          fontSize="2xl"
          resize="none"
          defaultValue={input}
          onChange={handleChange}
        />
        <InputRightElement
          h="full"
          pointerEvents="none"
          fontSize="2xl"
          children={<MdSearch />}
          zIndex="base"
        />
      </InputGroup>
      <VStack w="full" spacing="4" px="4" overflow="hidden" {...getRootProps()}>
        {input.length &&
          options.map((doc, idx) => (
            <EntityItem key={doc._id} {...getRadioProps({ value: doc._id })}>
              {doc[filter.field]}
            </EntityItem>
          ))}
      </VStack>
    </VStack>
  )
}
