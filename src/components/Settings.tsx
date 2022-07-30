import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Image,
  Text,
  useColorMode,
  VStack,
  Button,
} from '@chakra-ui/react'
import { useAsync } from '@react-hook/async'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import logoWithBorderURL from '../logoWithBorder.svg'

export default function Settings({ isShowing }: { isShowing: boolean }) {
  const { colorMode, toggleColorMode } = useColorMode()

  const navigate = useNavigate()
  const handleClose = useCallback(() => {
    navigate('/app/log')
  }, [navigate])

  const [{ status: dumpStatus }, doDumpDB] = useAsync(async () => {
    const { dumpDB } = await import('../utils/dumpDB')
    await dumpDB()
  })

  return (
    <Modal isOpen={isShowing} onClose={handleClose} size="full">
      <ModalContent>
        <ModalHeader
          py="2"
          textAlign="center"
          borderBottomWidth="1px"
          borderBottomColor={
            colorMode === 'dark' ? 'primary.900' : 'primary.100'
          }
        >
          Settings
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDir="column" alignItems="center">
          <VStack spacing="4" mt="16">
            <Image src={logoWithBorderURL} w="48" mx="auto" />
            <Text textStyle="brand" fontSize="5xl">
              TIME THIEF
            </Text>
          </VStack>
          <VStack flex="1" mt="16" spacing="8">
            <Button size="sm" onClick={toggleColorMode}>
              Switch to {colorMode === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
            <Button
              size="sm"
              onClick={doDumpDB}
              isLoading={dumpStatus === 'loading'}
            >
              Export Database
            </Button>
          </VStack>
          <Text mt="8" mb="2" opacity=".5">
            {process.env.NODE_ENV === 'development'
              ? 'development'
              : process.env.REACT_APP_VERSION}
          </Text>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
