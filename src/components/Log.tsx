import { Box, IconButton, Text, VStack } from '@chakra-ui/react'
import React from 'react'
import { MdInfo } from 'react-icons/md'
import { useAllDocs } from 'use-pouchdb'

export default function Log({ onShowAbout }: { onShowAbout: () => void }) {
  const { rows } = useAllDocs({ include_docs: true })
  // TODO: use content component system to render log
  return (
    <>
      <IconButton
        position="absolute"
        top="4"
        right="4"
        zIndex="overlay"
        aria-label="About this app"
        icon={<MdInfo />}
        variant="ghost"
        fontSize="2xl"
        onClick={onShowAbout}
      />
      <VStack align="flex-start" h="full" overflowY="scroll" padding="4">
        {rows.map((row) => {
          const entity = row.doc as any
          return (
            <Box>
              {entity.created}
              <Text textStyle="title" textAlign="left">
                {entity.title}
              </Text>
              <Text>{entity.content}</Text>
            </Box>
          )
        })}
      </VStack>
    </>
  )
}
