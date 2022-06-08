import { Flex, IconButton, InputGroup, VStack } from '@chakra-ui/react'
import { useRef } from 'react'
import { MdCamera } from 'react-icons/md'
import AttachmentImage from '../AttachmentImage'
import { ContentComponentProps } from '../contentComponents'

export default function PhotoInput({
  entityDoc,
  field,
  capture,
  saveAttachment,
}: ContentComponentProps) {
  const inputRef = useRef<HTMLInputElement>(null)

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
        <AttachmentImage
          docId={entityDoc._id}
          attachmentId={field}
          borderRadius="4"
          maxH="full"
        />
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
