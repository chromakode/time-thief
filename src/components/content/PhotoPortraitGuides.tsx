import {
  Box,
  Button,
  chakra,
  Flex,
  Icon,
  IconButton,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useAsync } from '@react-hook/async'
import { findLastIndex } from 'lodash'
import React, { Ref, useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { MdCamera, MdCheck, MdClose } from 'react-icons/md'
import { useFind } from 'use-pouchdb'
import AttachmentImage from '../AttachmentImage'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'

const ChakraVideo = chakra('video')

function Video({
  srcObject,
  ...props
}: { srcObject: MediaStream | undefined } & React.ComponentProps<
  typeof ChakraVideo
>) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!ref.current) {
      return
    }
    ref.current.srcObject = srcObject ?? null
  }, [srcObject])

  return <ChakraVideo ref={ref} {...props} autoPlay playsInline />
}

function Montage({
  docs,
  field,
  ...props
}: { docs: any; field: string } & Omit<
  React.ComponentProps<typeof AttachmentImage>,
  'docId' | 'attachmentId' | 'digest'
>) {
  // TODO: allow swiping horizontally through images
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!docs.length) {
      return
    }
    const interval = setInterval(() => {
      setIdx((curIdx) => (curIdx + 1) % docs.length)
    }, 250)
    return () => {
      clearInterval(interval)
    }
  }, [docs])

  const doc = docs[idx]
  return doc ? (
    <AttachmentImage
      {...props}
      docId={doc._id}
      attachmentId={field}
      digest={doc._attachments?.[field].digest}
    />
  ) : (
    <></>
  )
}

export default function PhotoPortraitGuides(
  { entityDoc, field, spec, saveAttachment }: ContentComponentProps,
  ref: Ref<ContentComponentRef>,
) {
  const { docs } = useFind<any>({
    index: {
      fields: ['type', 'created'],
    },
    selector: {
      type: entityDoc.type,
    },
    sort: ['type', 'created'],
  })
  const latestPhotoIdx = findLastIndex(docs, (doc) => doc._id !== entityDoc._id)
  const latestPhotos = docs.slice(latestPhotoIdx - 10, latestPhotoIdx)
  const tookPhoto = !!entityDoc._attachments?.[field]

  const cameraUIRef = useRef<HTMLDivElement>(null)
  const [isCameraOpen, setCameraOpen] = useState(false)

  const [{ value: stream }, startCamera] = useAsync(async () => {
    setCameraOpen(true)
    await new Promise<void>(flushSync)
    await cameraUIRef.current?.requestFullscreen({ navigationUI: 'hide' })
    try {
      await window.screen.orientation.lock('landscape')
    } catch (err) {
      console.warn('failed to lock orientation', err)
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    })
    const videoTrack = stream.getVideoTracks()[0]
    const capabilities = videoTrack.getCapabilities()
    videoTrack.applyConstraints({
      width: capabilities.width?.max,
      height: capabilities.height?.max,
    })
    return stream
  })

  const endCamera = useCallback(async () => {
    setCameraOpen(false)
    for (const track of stream?.getTracks() ?? []) {
      track.stop()
    }
    await Promise.all([
      window.screen.orientation.unlock(),
      document.exitFullscreen(),
    ])
  }, [stream])

  const handleFullscreenChange = useCallback(() => {
    if (document.fullscreenElement !== cameraUIRef.current) {
      endCamera()
    }
  }, [endCamera])

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [handleFullscreenChange])

  const handleCapture = useCallback(async () => {
    if (!stream) {
      return
    }
    const capture = new ImageCapture(stream?.getVideoTracks()[0])
    const blob = await capture.takePhoto()
    saveAttachment(field, blob)
    endCamera()
  }, [endCamera, field, saveAttachment, stream])

  // TODO error state

  return (
    <VStack px="4" flex="1" spacing="4">
      <Flex
        flexGrow="1"
        flexBasis="0"
        flexDir="column"
        overflow="hidden"
        alignItems="center"
        justifyContent="center"
      >
        {!isCameraOpen && (
          <Montage
            docs={docs}
            field={field}
            borderRadius="4"
            maxH="full"
            transform="scaleX(-1)"
          />
        )}
        {tookPhoto && (
          <Flex mt="4" alignItems="center" fontSize="large">
            <Icon as={MdCheck} mr="1" />
            <Text>photo taken</Text>
          </Flex>
        )}
      </Flex>
      <Button onClick={startCamera} fontSize="3xl" h="16">
        Start camera
      </Button>
      <Box
        ref={cameraUIRef}
        visibility={isCameraOpen ? 'visible' : 'hidden'}
        pointerEvents={isCameraOpen ? 'auto' : 'none'}
        bg="black"
        position="fixed"
        inset="-500px"
        zIndex="popover"
      >
        <Box m="1" position="absolute" left="5vw" transform="scaleX(-1)">
          {latestPhotos.map((doc) => (
            <AttachmentImage
              position="absolute"
              inset="0"
              opacity={0.5 / latestPhotos.length}
              docId={doc._id}
              attachmentId={field}
              digest={doc._attachments?.[field].digest}
              zIndex="overlay"
              pointerEvents="none"
              h="100vh"
              objectFit="contain"
            />
          ))}
          <Video srcObject={stream} h="100vh" />
        </Box>
        <VStack
          position="absolute"
          right="5vw"
          h="full"
          justify="center"
          opacity={isCameraOpen ? 1 : 0}
          transitionProperty="opacity"
          transitionDuration="350ms"
          transitionDelay="150ms"
        >
          <IconButton
            onClick={handleCapture}
            aria-label="Take picture"
            icon={<MdCamera />}
            fontSize="3xl"
            boxSize="16"
            m="8"
            variant="outline"
            color="primary.200"
            _hover={{ bg: 'none' }}
            _active={{ bg: 'primary.700' }}
          />
          <IconButton
            onClick={endCamera}
            aria-label="Cancel"
            icon={<MdClose />}
            fontSize="3xl"
            boxSize="16"
            m="8"
            variant="ghost"
            color="primary.200"
            _hover={{ bg: 'none' }}
            _active={{ bg: 'none' }}
          />
        </VStack>
      </Box>
    </VStack>
  )
}
