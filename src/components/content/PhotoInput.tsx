import { Flex, IconButton, InputGroup, VStack } from '@chakra-ui/react'
import useChange from '@react-hook/change'
import { Ref, useEffect, useRef, useState } from 'react'
import { MdCamera, MdImageSearch } from 'react-icons/md'
import AttachmentImage from '../AttachmentImage'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'
import Placeholder from '../Placeholder'

export default function PhotoInput(
  {
    entityDoc,
    field,
    capture,
    autostart,
    placeholder,
    saveAttachment,
  }: ContentComponentProps,
  ref: Ref<ContentComponentRef>,
) {
  const captureInputRef = useRef<HTMLInputElement>(null)
  const chooseInputRef = useRef<HTMLInputElement>(null)
  const [imgURL, setImgURL] = useState<string>()
  const [oldDigest, setOldDigest] = useState<string>()

  const imageDigest = entityDoc._attachments?.[field].digest

  function handleCaptureClick() {
    captureInputRef.current?.click()
  }

  function handleChooseClick() {
    chooseInputRef.current?.click()
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

  useEffect(() => {
    if (autostart) {
      handleCaptureClick()
    }
  }, [autostart])

  const hasImage = imgURL || imageDigest

  return (
    <VStack px="4" flex="1" spacing="4" w="full" minH="0">
      {hasImage && (
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
      )}
      {!hasImage && (
        <Placeholder
          type={placeholder}
          position="relative"
          top="-8"
          w="auto"
          h="auto"
          flex="1"
          minH="0"
          opacity=".75"
        />
      )}
      <Flex position="relative" alignItems="center">
        <InputGroup w="auto" onClick={handleCaptureClick}>
          <input
            ref={captureInputRef}
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
        <InputGroup
          w="auto"
          position="absolute"
          right="-20"
          onClick={handleChooseClick}
        >
          <input
            ref={chooseInputRef}
            type="file"
            // On Android, raw files show up as dupes in the uploader picker.
            // Let's filter them out by allowlisting specific image types.
            accept="image/jpeg,image/png,image/webm,image/avif"
            onChange={handleChange}
            hidden
          />
          <IconButton
            aria-label="Choose existing image"
            icon={<MdImageSearch />}
            variant="outline"
            fontSize="3xl"
            boxSize="12"
            opacity=".5"
          />
        </InputGroup>
      </Flex>
    </VStack>
  )
}
