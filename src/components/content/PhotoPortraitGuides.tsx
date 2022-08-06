import {
  Box,
  Button,
  Center,
  chakra,
  Flex,
  Icon,
  IconButton,
  Portal,
  Text,
  useMediaQuery,
  VStack,
} from '@chakra-ui/react'
import { useAsync } from '@react-hook/async'
import useIntersectionObserver from '@react-hook/intersection-observer'
import { findLastIndex } from 'lodash'
import React, { Ref, useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  MdCamera,
  MdCheck,
  MdClose,
  MdPause,
  MdPlayArrow,
  MdRotateLeft,
} from 'react-icons/md'
import { useFind } from 'use-pouchdb'
import AttachmentImage from '../AttachmentImage'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'
import Placeholder from '../Placeholder'

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

  return <ChakraVideo ref={ref} {...props} autoPlay playsInline muted />
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
  const [isPaused, setPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { isIntersecting } = useIntersectionObserver(containerRef)

  const handlePauseClick = useCallback(() => {
    setPaused((isPaused) => !isPaused)
  }, [])

  useEffect(() => {
    if (!docs.length || !isIntersecting || isPaused) {
      return
    }
    const interval = setInterval(() => {
      setIdx((curIdx) => (curIdx + 1) % docs.length)
    }, Math.max(500 / docs.length, 100))
    return () => {
      clearInterval(interval)
    }
  }, [docs, isIntersecting, isPaused])

  const doc = docs[idx]
  return (
    <Flex
      ref={containerRef}
      minH="1px" // Ensure starts onscreen
      minW="1px"
      justifyContent="center"
      position="relative"
      overflow="hidden"
    >
      {doc && (
        <AttachmentImage
          {...props}
          docId={doc._id}
          attachmentId={field}
          digest={doc._attachments?.[field].digest}
        />
      )}
      <IconButton
        icon={!isPaused ? <MdPause /> : <MdPlayArrow />}
        onClick={handlePauseClick}
        aria-label="Pause"
        position="absolute"
        bottom="2"
        left="2"
        size="xs"
        opacity=".75"
      />
    </Flex>
  )
}

export default function PhotoPortraitGuides(
  {
    entityDoc,
    field,
    spec,
    placeholder,
    saveAttachment,
  }: ContentComponentProps,
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
  const latestPhotos = docs.slice(
    Math.max(0, latestPhotoIdx - 10),
    latestPhotoIdx,
  )
  const tookPhoto = !!entityDoc._attachments?.[field]

  const cameraUIRef = useRef<HTMLDivElement>(null)
  const [isCameraOpen, setCameraOpen] = useState(false)

  const [isLandscape] = useMediaQuery('(orientation: landscape)')

  const [{ value: stream }, startCamera] = useAsync(async () => {
    setCameraOpen(true)
    await new Promise<void>(flushSync)
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    })
    try {
      await cameraUIRef.current?.requestFullscreen({ navigationUI: 'hide' })
    } catch (err) {
      console.warn('failed to request fullscreen', err)
    }
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
    await document.exitFullscreen()
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

  const showWithDelay = {
    opacity: isCameraOpen ? 1 : 0,
    transitionProperty: 'opacity',
    transitionDuration: '350ms',
    transitionDelay: '150ms',
  }

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
        {!isCameraOpen &&
          (false && docs.length ? (
            <Montage
              docs={docs}
              field={field}
              borderRadius="4"
              maxH="full"
              transform="scaleX(-1)"
            />
          ) : (
            <Placeholder type={placeholder} h="full" pb="16" opacity=".75" />
          ))}
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
      <Portal>
        <Flex
          ref={cameraUIRef}
          visibility={isCameraOpen ? 'visible' : 'hidden'}
          pointerEvents={isCameraOpen ? 'auto' : 'none'}
          flexDir={isLandscape ? 'row' : 'column'}
          bg="black"
          position="fixed"
          inset="0"
          zIndex="popover"
        >
          <Box flex="3" m="1" position="relative">
            {isLandscape ? (
              <Box
                position="absolute"
                inset="0"
                transform="scaleX(-1)"
                filter="invert(1) contrast(175%)"
                mixBlendMode="overlay"
                zIndex="overlay"
              >
                {isCameraOpen &&
                  latestPhotos.map((doc) => (
                    <AttachmentImage
                      key={doc._id}
                      position="absolute"
                      inset="0"
                      opacity={1 / latestPhotos.length}
                      docId={doc._id}
                      attachmentId={field}
                      digest={doc._attachments?.[field].digest}
                      pointerEvents="none"
                      showPlaceholder={false}
                    />
                  ))}
              </Box>
            ) : (
              <Center
                position="absolute"
                inset="0"
                zIndex="overlay"
                {...showWithDelay}
              >
                <VStack
                  color="white"
                  background="blackAlpha.500"
                  p="6"
                  borderRadius="xl"
                  backdropFilter="auto"
                  backdropBlur="lg"
                >
                  <Icon as={MdRotateLeft} boxSize="20" />
                  <Text fontSize="3xl" fontWeight="700">
                    Rotate to landscape
                  </Text>
                </VStack>
              </Center>
            )}
            <Video
              srcObject={stream}
              w="full"
              h="full"
              transform="scaleX(-1)"
            />
          </Box>
          <Flex
            flex="1"
            flexDir={isLandscape ? 'column' : 'row'}
            justifyContent="center"
            alignItems="center"
            {...showWithDelay}
          >
            <IconButton
              onClick={handleCapture}
              aria-label="Take picture"
              icon={<MdCamera />}
              fontSize="3xl"
              boxSize="16"
              m="4"
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
              m="4"
              variant="ghost"
              color="primary.200"
              _hover={{ bg: 'none' }}
              _active={{ bg: 'none' }}
            />
          </Flex>
        </Flex>
      </Portal>
    </VStack>
  )
}
