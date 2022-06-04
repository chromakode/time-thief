import { Center, Heading } from '@chakra-ui/react'
import { useEffect } from 'react'
import { ContentComponentProps } from '../contentComponents'

export default function ContentTitle({
  entityDoc,
  text,
  save,
}: ContentComponentProps) {
  useEffect(() => {
    // FIXME: only set title of entity exists -- can we do this a better way, maybe using the entity field mapping?
    if (entityDoc._rev && entityDoc.title !== text) {
      save({ title: text })
    }
  }, [entityDoc._rev, entityDoc.title, save, text])
  return (
    <Center h="20vh" px="4" flexShrink="0">
      <Heading textStyle="title">{text}</Heading>
    </Center>
  )
}
