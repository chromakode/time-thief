import { VStack, Flex, InputGroup, Image, IconButton } from '@chakra-ui/react'
import { useRef, useMemo } from 'react'
import { MdCamera } from 'react-icons/md'
import { ContentComponentProps } from '../contentComponents'

export default function PhotoInput({
  entityDoc,
  field,
  capture,
  saveAttachment,
}: ContentComponentProps) {
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
}
