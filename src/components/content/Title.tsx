import { Center, Heading } from '@chakra-ui/react'
import { Ref, useEffect } from 'react'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'
import Markdown from './Markdown'

export default function ContentTitle(
  { entityDoc, text, set }: ContentComponentProps,
  ref: Ref<ContentComponentRef>,
) {
  useEffect(() => {
    set({ title: text }, { dirty: false })
  }, [entityDoc._rev, entityDoc.title, set, text])
  return (
    <Center h="20vh" px="4" flexShrink="0">
      <Heading textStyle="title" textAlign="center" whiteSpace="pre-wrap">
        <Markdown>{text}</Markdown>
      </Heading>
    </Center>
  )
}
