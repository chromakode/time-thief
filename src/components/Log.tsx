import { Box, Text, VStack } from '@chakra-ui/react'
import React from 'react'
import { useAllDocs } from 'use-pouchdb'

export default function Log() {
  const { rows } = useAllDocs({ include_docs: true })
  // TODO: use content component system to render log
  return (
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
  )
}
