import { Box, Image, ImageProps } from '@chakra-ui/react'
import useIntersectionObserver from '@react-hook/intersection-observer'
import { useLayoutEffect, useRef, useState } from 'react'
import { useDoc } from 'use-pouchdb'

export default function AttachmentImage({
  docId,
  attachmentId,
  ...props
}: { docId: string; attachmentId: string } & ImageProps) {
  const ref = useRef<HTMLImageElement>(null)
  const { isIntersecting } = useIntersectionObserver(ref, {
    rootMargin: '500px 0px 500px 0px',
  })

  const { doc, loading } = useDoc(docId, { attachments: true, binary: true })
  const srcRef = useRef<string>()
  const [_, setDigest] = useState()

  const attachment = loading ? undefined : doc?._attachments[attachmentId]

  useLayoutEffect(() => {
    if (attachment?.data && isIntersecting) {
      srcRef.current = URL.createObjectURL(attachment.data)
      setDigest(attachment.digest)
    }
    return () => {
      if (srcRef.current) {
        URL.revokeObjectURL(srcRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntersecting, attachment?.digest])

  return (
    <Box ref={ref}>
      {srcRef.current && <Image ref={ref} {...props} src={srcRef.current} />}
    </Box>
  )
}
