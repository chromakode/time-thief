import { Flex, IconButton, InputGroup, VStack } from '@chakra-ui/react'
import { Ref, useEffect, useRef, useState } from 'react'
import { MdCamera } from 'react-icons/md'
import AttachmentImage from '../AttachmentImage'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'

export default function PhotoInput(
  { entityDoc, field, capture, saveAttachment }: ContentComponentProps,
  ref: Ref<ContentComponentRef>,
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isWorking, setWorking] = useState(false)

  function handleClick() {
    inputRef.current?.click()
  }

  function handleChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const { files } = ev.target
    if (files?.length === 1) {
      setWorking(true)
      saveAttachment(field, files[0])
    }
  }

  const imageDigest = entityDoc._attachments?.[field].digest
  useEffect(() => {
    setWorking(false)
  }, [imageDigest])

  return (
    <VStack px="4" flex="1" spacing="4" w="full">
      <Flex
        flexGrow="1"
        flexBasis="0"
        w="full"
        overflow="hidden"
        alignItems="stretch"
        justifyContent="stretch"
      >
        <AttachmentImage
          docId={entityDoc._id}
          attachmentId={field}
          digest={imageDigest}
          borderRadius="4"
          maxH="full"
          w="full"
          isWorking={isWorking}
          showSpinner
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
