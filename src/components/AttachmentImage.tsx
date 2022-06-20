import { Image, ImageProps } from '@chakra-ui/react'
import useIntersectionObserver from '@react-hook/intersection-observer'
import LRU from 'lru-cache'
import { useRef } from 'react'
import { usePouch } from 'use-pouchdb'
import { useAsyncEffect } from '@react-hook/async'

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
) {
  let url = imgCache.get(digest)
  if (url !== undefined) {
    return url
  }

  const blob = (await db.getAttachment(docId, attachmentId)) as Blob
  url = URL.createObjectURL(blob)
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
  const ref = useRef<HTMLImageElement>(null)
  const { isIntersecting } = useIntersectionObserver(ref, {
    rootMargin: '500px 0px 500px 0px',
  })

  useAsyncEffect(async () => {
    if (!isIntersecting) {
      return
    }
    const url = await getImg(db, digest, docId, attachmentId)
    if (!ref.current || ref.current.src === url) {
      return
    }
    ref.current.src = url
  }, [attachmentId, db, digest, docId, isIntersecting])

  return <Image ref={ref} bg="blackAlpha.100" {...props} />
}
