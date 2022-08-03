import { Flex, FlexProps, Image } from '@chakra-ui/react'
import { useAsyncEffect } from '@react-hook/async'
import useIntersectionObserver from '@react-hook/intersection-observer'
import LRU from 'lru-cache'
import PouchDB from 'pouchdb'
import { useCallback, useMemo, useRef, useState } from 'react'
import { usePouch } from 'use-pouchdb'
import { once } from 'events'

const thumbDB = new PouchDB('thumbnails')

const THUMB_WIDTH = 1280
const THUMB_KEY = `thumb-v2-${THUMB_WIDTH}`

const urlGetterCache = new LRU({
  max: 100,
  dispose: (value: Promise<string | undefined>) => {
    value.then((url) => {
      if (!url) {
        return
      }
      URL.revokeObjectURL(url)
    })
  },
})

export async function getImg(
  db: PouchDB.Database<any>,
  digest: string,
  docId: string,
  attachmentId: string,
  full: boolean,
): Promise<string | undefined> {
  async function getURL() {
    if (full) {
      const blob = (await db.getAttachment(docId, attachmentId)) as Blob
      return URL.createObjectURL(blob)
    } else {
      let thumbDoc
      let thumbBlob: Blob | null = null
      try {
        thumbDoc = await thumbDB.get(digest, {
          attachments: true,
          binary: true,
        })
        const thumbAttachment = thumbDoc?._attachments?.[THUMB_KEY]
        thumbBlob =
          thumbAttachment && 'data' in thumbAttachment
            ? (thumbAttachment.data as Blob)
            : null
      } catch (err) {
        if (err instanceof Error && err.name !== 'not_found') {
          throw err
        }
      }

      if (!thumbBlob) {
        const fullBlob = (await db.getAttachment(docId, attachmentId)) as Blob
        const fullBlobURL = URL.createObjectURL(fullBlob)
        const img = document.createElement('img')
        img.src = fullBlobURL
        await once(img, 'load')
        const canvas = document.createElement('canvas')
        canvas.width = THUMB_WIDTH
        canvas.height = THUMB_WIDTH * (img.naturalHeight / img.naturalWidth)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return undefined
        }
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        thumbBlob = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/webp'),
        )
        URL.revokeObjectURL(fullBlobURL)

        if (thumbBlob) {
          await thumbDB.put({
            ...thumbDoc,
            _id: digest,
            _attachments: {
              [THUMB_KEY]: {
                content_type: 'image/webp',
                data: thumbBlob,
              },
            },
            created: Date.now(),
          })
        }
      }

      return thumbBlob ? URL.createObjectURL(thumbBlob) : undefined
    }
  }

  const cacheKey = `${full ? 'full' : 'thumb'}-${digest}`
  let urlGetter = urlGetterCache.get(cacheKey)

  if (!urlGetter) {
    urlGetter = getURL()
    urlGetterCache.set(cacheKey, urlGetter)
  }

  return await urlGetter
}

export default function AttachmentImage({
  digest,
  docId,
  attachmentId,
  fallbackSrc,
  full = false,
  showPlaceholder = true,
  opacity = 1,
  ...props
}: {
  digest: string | undefined
  docId: string
  attachmentId: string
  fallbackSrc?: string
  full?: boolean
  showPlaceholder?: boolean
} & FlexProps) {
  const db = usePouch()
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const loadedSrc = useRef<string | null>(null)
  const [isLoaded, setLoaded] = useState(false)

  const { isIntersecting } = useIntersectionObserver(containerRef, {
    rootMargin: '1000px 0px 1000px 0px',
  })

  useAsyncEffect(async () => {
    const img = imgRef.current
    if (!img) {
      return
    }

    if (!isIntersecting || !digest) {
      return
    }

    // If we have a fallback src, unset the URL while loading so that it shows.
    // Otherwise, keep the existing src, which prevents flashes on src changes
    // (e.g. during portrait montage).
    if (!loadedSrc.current && fallbackSrc) {
      img.src = fallbackSrc
    }

    if (!digest) {
      return
    }

    let url
    try {
      url = await getImg(db, digest, docId, attachmentId, full)
    } catch (err) {
      console.warn('error getting image', err)
      return
    }

    if (url) {
      loadedSrc.current = url
      img.src = url
    }
  }, [attachmentId, db, digest, docId, isIntersecting, fallbackSrc])

  const handleLoad = useCallback(() => {
    if (!imgRef.current || !containerRef.current) {
      return
    }
    setLoaded(true)
  }, [])

  return useMemo(
    () => (
      <Flex
        ref={containerRef}
        bg={
          digest && !isLoaded && showPlaceholder
            ? 'blackAlpha.100'
            : 'transparent'
        }
        transitionDuration="200ms"
        {...props}
        align="center"
        justify="center"
      >
        <Image
          ref={imgRef}
          opacity={isLoaded ? opacity : 0}
          transitionDuration="200ms"
          onLoad={handleLoad}
          src={fallbackSrc}
          w="full"
          h="full"
          objectFit="contain"
          draggable="false"
        />
      </Flex>
    ),
    [
      digest,
      fallbackSrc,
      handleLoad,
      isLoaded,
      opacity,
      props,
      showPlaceholder,
    ],
  )
}
