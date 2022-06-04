import {
  Center,
  Flex,
  Heading,
  IconButton,
  Image,
  InputGroup,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import '@fontsource/roboto-flex/variable-full.css'
import { debounce } from 'lodash'
import React, { useEffect, useMemo, useRef } from 'react'
import { MdCamera } from 'react-icons/md'

// TODO: per component type typescc

interface ComponentProps {
  db: PouchDB.Database
  entityDoc: {
    _id: string
    [key: string]: any
  }
  save: (updates: { [key: string]: any }) => void
  saveAttachment: (id: string, attachment: Blob) => void
  [key: string]: any
}

const contentComponents: Map<string, React.FunctionComponent<any>> = new Map()

contentComponents.set(
  'title',
  function Title({ entityDoc, text, save }: ComponentProps) {
    useEffect(() => {
      // FIXME: only set title of entity exists -- can we do this a better way, maybe using the entity field mapping?
      if (entityDoc._rev && entityDoc.title !== text) {
        save({ title: text })
      }
    }, [entityDoc._rev, entityDoc.title, save, text])
    return (
      <Center h="20vh" px="4" flexShrink="0">
        <Heading textStyle="title">{text}</Heading>
      </Center>
    )
  },
)

contentComponents.set(
  'input/multi-line',
  function MultilineInput({ entityDoc, field, save }: ComponentProps) {
    const storedValue = entityDoc[field]
    const handleChange = debounce(function (
      ev: React.ChangeEvent<HTMLTextAreaElement>,
    ) {
      save({ [field]: ev.target.value })
    },
    100)
    return (
      <Flex px="4" w="full" flex="1">
        <Textarea
          w="full"
          h="full"
          variant="filled"
          fontSize="xl"
          resize="none"
          defaultValue={storedValue}
          onChange={handleChange}
          sx={{ touchAction: 'pan-y' }}
        />
      </Flex>
    )
  },
)

contentComponents.set(
  'input/photo',
  function PhotoInput({
    entityDoc,
    field,
    capture,
    saveAttachment,
  }: ComponentProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    const storedImage = entityDoc._attachments?.[field]

    const imageURL = useMemo(
      () => (storedImage ? URL.createObjectURL(storedImage.data) : null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [storedImage?.digest],
    )

    function handleClick() {
      inputRef.current?.click()
    }

    function handleChange(ev: React.ChangeEvent<HTMLInputElement>) {
      const { files } = ev.target
      if (files?.length === 1) {
        saveAttachment(field, files[0])
      }
    }
    return (
      <VStack px="4" flex="1" spacing="4">
        <Flex flexGrow="1" flexBasis="0" overflow="hidden" alignItems="center">
          {imageURL && (
            <Image
              src={imageURL}
              borderRadius="4"
              h="full"
              w="full"
              objectFit="contain"
            />
          )}
        </Flex>
        <InputGroup w="auto" onClick={handleClick}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture={capture}
            onChange={handleChange}
            hidden
          />
          <IconButton
            aria-label="Open camera"
            icon={<MdCamera />}
            fontSize="3xl"
            boxSize="16"
          />
        </InputGroup>
      </VStack>
    )
  },
)

export default contentComponents
