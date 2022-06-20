import { Box, Image, ImageProps } from '@chakra-ui/react'
import useIntersectionObserver from '@react-hook/intersection-observer'
import LRU from 'lru-cache'
import { useRef } from 'react'
import { usePouch } from 'use-pouchdb'
import { useAsyncEffect } from '@react-hook/async'
import PouchDB from 'pouchdb'

const thumbDB = new PouchDB('thumbnails')

const THUMB_WIDTH = 1280
const THUMB_KEY = `thumb-v1-${THUMB_WIDTH}`

const imgCache = new LRU({
  max: 100,
  dispose: (value: string) => {
    URL.revokeObjectURL(value)
  },
})

async function getImg(
  db: PouchDB.Database<any>,
  digest: string,
  docId: string,
  attachmentId: string,
): Promise<string | null> {
  let url = imgCache.get(digest)
  if (url !== undefined) {
    return url
  }

  let thumbDoc
  let thumbBlob: Blob | null = null
  try {
    thumbDoc = await thumbDB.get(digest, { attachments: true, binary: true })
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
    const blob = (await db.getAttachment(docId, attachmentId)) as Blob
    const imgBitmap = await createImageBitmap(blob, {
      resizeWidth: THUMB_WIDTH,
      resizeQuality: 'high',
    })
    const canvas = document.createElement('canvas')
    canvas.width = imgBitmap.width
    canvas.height = imgBitmap.height
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(imgBitmap, 0, 0)
    thumbBlob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/webp'),
    )

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
      })
    }
  }

  if (!thumbBlob) {
    return null
  }

  url = URL.createObjectURL(thumbBlob)
  imgCache.set(digest, url)

  return url
}

export default function AttachmentImage({
  digest,
  docId,
  attachmentId,
  ...props
}: { digest: string; docId: string; attachmentId: string } & ImageProps) {
  const db = usePouch()
  const containerRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLImageElement>(null)
  const { isIntersecting } = useIntersectionObserver(containerRef, {
    rootMargin: '1000px 0px 1000px 0px',
  })

  useAsyncEffect(async () => {
    if (!isIntersecting) {
      return
    }

    let url
    try {
      url = await getImg(db, digest, docId, attachmentId)
    } catch (err) {
      console.warn('error getting image', err)
      return
    }

    if (!url || !ref.current || ref.current.src === url) {
      return
    }

    ref.current.src = url
    ref.current.style.opacity = '1'
  }, [attachmentId, db, digest, docId, isIntersecting])

  return (
    <Box ref={containerRef} bg="blackAlpha.100">
      <Image ref={ref} opacity="0" transitionDuration="200ms" {...props} />
    </Box>
  )
}
