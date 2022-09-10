import { Box, Center, Heading, VStack } from '@chakra-ui/react'
import { Ref, useEffect } from 'react'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'
import Markdown from '../Markdown'

export default function ContentTitle(
  { entityDoc, text, subtitle, set, reserveButtonSpace }: ContentComponentProps,
  ref: Ref<ContentComponentRef>,
) {
  useEffect(() => {
    set({ title: text }, { dirty: false })
  }, [entityDoc._rev, entityDoc.title, set, text])
  return (
    <Center h="20vh" px="2" flexShrink="0">
      <VStack textAlign="center" whiteSpace="pre-wrap">
        <Heading textStyle="title">
          {reserveButtonSpace && (
            // Make space for back button
            <>
              <Box w="16" h="8" float="left" alignSelf="flex-start" />
              <Box w="16" h="8" float="right" alignSelf="flex-start" />
            </>
          )}
          <Markdown>{text}</Markdown>
        </Heading>
        {subtitle && (
          <Heading as="h2" fontSize="md" fontWeight="medium" lineHeight="tall">
            <Markdown>{subtitle}</Markdown>
          </Heading>
        )}
      </VStack>
    </Center>
  )
}
