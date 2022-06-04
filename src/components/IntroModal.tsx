import {
  Badge,
  Box,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react'
import React, { useCallback } from 'react'
import { useDoc, usePouch } from 'use-pouchdb'

export function useShowingIntro() {
  const db = usePouch()
  const { doc: config, loading } = useDoc('config', {}, { introSeen: false })

  const showingIntro = !loading && config?.introSeen === false

  const closeIntro = useCallback(() => {
    db.put({ ...config, introSeen: true })
  }, [config, db])

  return { showingIntro, closeIntro }
}

export function IntroModal() {
  const { showingIntro, closeIntro } = useShowingIntro()
  return (
    <Modal isOpen={showingIntro} onClose={closeIntro} isCentered>
      <ModalOverlay />
      <ModalContent pb="4" mx="3">
        <ModalHeader
          display="flex"
          alignItems="baseline"
          justifyContent="center"
          pb="0"
        >
          <Box position="relative">
            <Text textStyle="brand" fontSize="5xl">
              TIME THIEF
            </Text>
            <Badge
              position="absolute"
              right="-1.5rem"
              bottom=".9rem"
              fontSize=".6rem"
              transform="skew(-8deg)"
              bg="primary.300"
              color="primary.25"
            >
              BETA
            </Badge>
          </Box>
        </ModalHeader>
        <ModalCloseButton _focus={{ boxShadow: 'none' }} />
        <ModalBody fontSize="lg" fontWeight="medium">
          <HStack
            justify="center"
            spacing="2"
            mb="4"
            border="1px"
            borderLeft="none"
            borderRight="none"
            borderColor="primary.300"
            py="3"
          >
            <Text fontSize="4xl">⚠️</Text>
            <Text fontWeight="bold" color="primary.500" textAlign="center">
              This device is engaging in a <br />
              heist of your attention.
            </Text>
          </HStack>
          <Text>
            <Text as="strong" display="inline" textStyle="brandStraight">
              TIME THIEF
            </Text>{' '}
            is a journal that steals your time back and hoards memories for the
            future.
          </Text>
          <VStack my="2" align="flex-start">
            <HStack spacing="4">
              <Text>🕑</Text>
              <Text>Every 15 minutes, you'll get new prompts.</Text>
            </HStack>
            <HStack spacing="4">
              <Text>✌️</Text>
              <Text>All done? There's nothing else to do but wait.</Text>
            </HStack>
            <HStack spacing="4">
              <Text>🔒</Text>
              <Text>Data is stored privately on your device.</Text>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
