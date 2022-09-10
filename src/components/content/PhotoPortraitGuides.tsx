import {
  Box,
  BoxProps,
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
import useSize from '@react-hook/size'
import { findLastIndex } from 'lodash'
import React, { Ref, useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  MdCamera,
  MdCheck,
  MdClose,
  MdPause,
  MdPlayArrow,
} from 'react-icons/md'
import { useFind } from 'use-pouchdb'
import AttachmentImage from '../AttachmentImage'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'
import MotionBox from '../MotionBox'
import Placeholder from '../Placeholder'

// For now, we assume that all cameras are natively 4:3. This makes the layout
// logic much simpler.
const ASPECT_RATIO = 4 / 3
const ASPECT_RATIO_INV = 1 / ASPECT_RATIO

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

function useCamera(cameraUIRef: React.RefObject<HTMLElement>) {
  const DEFAULT_WIDTH = 1280
  const DEFAULT_HEIGHT = 960
  const constraintsRef = useRef<{ width: number; height: number }>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  })

  const [{ value: stream }, start] = useAsync(async () => {
    await new Promise<void>(flushSync)
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    })
    try {
      await cameraUIRef.current?.requestFullscreen({ navigationUI: 'hide' })
    } catch (err) {
      console.warn('failed to request fullscreen', err)
    }
    try {
      await window.screen.orientation.lock('landscape')
    } catch (err) {
      console.warn('failed to lock orientation', err)
    }

    const videoTrack = stream.getVideoTracks()[0]
    const capabilities = videoTrack.getCapabilities()
    const maxWidth = capabilities.width?.max ?? DEFAULT_WIDTH
    const maxHeight = capabilities.height?.max ?? DEFAULT_HEIGHT
    const constraints = {
      width: Math.min(maxWidth, Math.round(maxHeight * ASPECT_RATIO)),
      height: Math.min(maxHeight, Math.round(maxWidth * ASPECT_RATIO_INV)),
    }
    constraintsRef.current = constraints

    videoTrack.applyConstraints(constraints)

    return stream
  })

  const end = useCallback(async () => {
    for (const track of stream?.getTracks() ?? []) {
      track.stop()
    }
    try {
      await document.exitFullscreen()
    } catch (err) {
      console.warn('failed to exit fullscreen', err)
    }
    try {
      await window.screen.orientation.unlock()
    } catch (err) {
      console.warn('failed to unlock orientation', err)
    }
  }, [stream])

  const capture = useCallback(async () => {
    if (!stream) {
      return
    }
    const videoTrack = stream?.getVideoTracks()[0]
    const capture = new ImageCapture(videoTrack)
    const { width, height } = constraintsRef.current
    const blob = await capture.takePhoto({
      imageWidth: width,
      imageHeight: height,
    })
    end()
    return blob
  }, [end, stream])

  const handleFullscreenChange = useCallback(() => {
    if (document.fullscreenElement !== cameraUIRef.current) {
      end()
    }
  }, [cameraUIRef, end])

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [handleFullscreenChange])

  return { stream, start, end, capture }
}

function CameraUI({
  docs,
  field,
  currentPhotoId,
  stream,
  onCapture,
  onCancel,
}: {
  docs: any[]
  field: string
  currentPhotoId: string
  stream: MediaStream | undefined
  onCapture: () => void
  onCancel: () => void
}) {
  const latestPhotoIdx = findLastIndex(
    docs,
    (doc) => doc._id !== currentPhotoId,
  )
  const latestPhotos = docs.slice(
    Math.max(0, latestPhotoIdx - 10),
    latestPhotoIdx,
  )

  const imageFrameRef = useRef<HTMLDivElement>(null)
  const [isLandscape] = useMediaQuery('(orientation: landscape)')

  // TODO: This approach is a bit overcomplicated. I decided to rotate only the
  // image overlay portions of the UI, since the camera video needs to be
  // untransformed. It would probably simplify the layout to rotate and
  // transform the entire UI, and then un-rotate the camera view. A big
  // advantage would be to be able to use width/height consistently everywhere
  // rather than transposing them below.

  const [frameWidth, frameHeight] = useSize(imageFrameRef)

  const orientedWidth = isLandscape ? frameWidth : frameHeight
  const orientedHeight = isLandscape ? frameHeight : frameWidth

  const constrainedWidth = Math.min(
    orientedWidth,
    ASPECT_RATIO * orientedHeight,
  )
  const constrainedHeight = Math.min(
    ASPECT_RATIO_INV * orientedWidth,
    orientedHeight,
  )

  const absoluteWidth = isLandscape ? constrainedWidth : constrainedHeight
  const absoluteHeight = isLandscape ? constrainedHeight : constrainedWidth

  const baseOverlayProps: BoxProps = {
    position: 'absolute',
    inset: '0',
    width: constrainedWidth,
    height: constrainedHeight,
    zIndex: 'overlay',
  }
  const rotateOverlayProps = !isLandscape
    ? {
        transform: `rotate(90deg) translateY(-100%)`,
        transformOrigin: 'top left',
        ...baseOverlayProps,
      }
    : baseOverlayProps

  const eyeGuideX = '44%'
  const eyeGuideY = '45%'
  const eyeGuideSize = `${Math.max(8, constrainedWidth * 0.015)}px`

  return (
    <Flex
      flexDir={isLandscape ? 'row' : 'column'}
      bg="black"
      position="absolute"
      inset="0"
      userSelect="none"
    >
      <Center ref={imageFrameRef} flex="3" overflow="hidden">
        <Box w={absoluteWidth} h={absoluteHeight} position="relative">
          <Flex
            mixBlendMode="difference"
            {...rotateOverlayProps}
            alignItems="center"
            justifyContent="center"
          >
            <Box
              position="absolute"
              left={eyeGuideX}
              top={eyeGuideY}
              w={eyeGuideSize}
              h={eyeGuideSize}
              transform="translate(-50%, -50%)"
              bg="white"
              borderRadius="full"
            />
            <Box
              position="absolute"
              right={eyeGuideX}
              top={eyeGuideY}
              w={eyeGuideSize}
              h={eyeGuideSize}
              transform="translate(-50%, -50%)"
              bg="white"
              borderRadius="full"
              mixBlendMode="difference"
            />
          </Flex>
          <Box {...rotateOverlayProps} zIndex="toast">
            <Flex
              position="absolute"
              left="0"
              right="0"
              bottom="8"
              justifyContent="center"
            >
              <Text
                px="3"
                py="1"
                borderRadius="md"
                bg="primary.50"
                color="primary.500"
                fontSize="md"
                fontWeight="bold"
              >
                Line up your eyes with the dots.
              </Text>
            </Flex>
          </Box>
          <Box
            filter="invert(1) brightness(.9) contrast(200%)"
            mixBlendMode="luminosity"
            {...rotateOverlayProps}
          >
            <Box position="absolute" inset="0" transform="scaleX(-1)">
              {latestPhotos.map((doc) => (
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
          </Box>
          <Video
            position="absolute"
            inset="0"
            srcObject={stream}
            transform="scaleX(-1)"
          />
        </Box>
      </Center>
      <MotionBox
        display="flex"
        flex="1"
        flexDir={isLandscape ? 'column-reverse' : 'row'}
        justifyContent="center"
        alignItems="center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <IconButton
          onClick={onCancel}
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
        <IconButton
          onClick={onCapture}
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
      </MotionBox>
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
  const tookPhoto = !!entityDoc._attachments?.[field]
  const [isCameraOpen, setCameraOpen] = useState(false)

  const cameraUIRef = useRef<HTMLDivElement>(null)
  const camera = useCamera(cameraUIRef)

  const handleStartCamera = useCallback(() => {
    setCameraOpen(true)
    camera.start()
  }, [camera])

  const handleCaptureCamera = useCallback(async () => {
    const blob = await camera.capture()
    if (!blob) {
      // TODO error state
      return
    }
    setCameraOpen(false)
    camera.end()
    saveAttachment(field, blob)
  }, [camera, field, saveAttachment])

  const handleCancelCamera = useCallback(() => {
    setCameraOpen(false)
    camera.end()
  }, [camera])

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
          (docs.length ? (
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
      <Button onClick={handleStartCamera} fontSize="3xl" h="16">
        Start camera
      </Button>
      <Portal>
        <Box
          ref={cameraUIRef}
          position={isCameraOpen ? 'fixed' : 'static'}
          inset="0"
          zIndex="popover"
        >
          {isCameraOpen && (
            <CameraUI
              docs={docs}
              field={field}
              currentPhotoId={entityDoc._id}
              stream={camera.stream}
              onCapture={handleCaptureCamera}
              onCancel={handleCancelCamera}
            />
          )}
        </Box>
      </Portal>
    </VStack>
  )
}
