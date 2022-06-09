import { Box, Image, ImageProps } from '@chakra-ui/react'
import useIntersectionObserver from '@react-hook/intersection-observer'
import LRU from 'lru-cache'
import { useEffect, useRef, useState } from 'react'
import { usePouch } from 'use-pouchdb'

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

  const [src, setSrc] = useState<string>()

  useEffect(() => {
    if (isIntersecting) {
      getImg(db, digest, docId, attachmentId).then((url) => setSrc(url))
    }
  }, [attachmentId, db, digest, docId, isIntersecting])

  return <Box ref={ref}>{src && <Image ref={ref} {...props} src={src} />}</Box>
}
