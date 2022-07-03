import { Flex, IconButton, InputGroup, VStack } from '@chakra-ui/react'
import useChange from '@react-hook/change'
import { Ref, useRef, useState } from 'react'
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
  const [imgURL, setImgURL] = useState<string>()
  const [oldDigest, setOldDigest] = useState<string>()

  const imageDigest = entityDoc._attachments?.[field].digest

  function handleClick() {
    inputRef.current?.click()
  }

  async function handleChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const { files } = ev.target
    if (files?.length === 1) {
      setOldDigest(imageDigest)
      setImgURL(URL.createObjectURL(files[0]))
      await saveAttachment(field, files[0])
    }
  }

  useChange(imgURL, (current, prev) => {
    if (prev) {
      URL.revokeObjectURL(prev)
    }
  })

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
          key={imgURL}
          docId={entityDoc._id}
          attachmentId={field}
          digest={imageDigest === oldDigest ? undefined : imageDigest}
          fallbackSrc={imgURL}
          borderRadius="4"
          maxH="full"
          w="full"
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
