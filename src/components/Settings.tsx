import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Image,
  Text,
  useColorMode,
  VStack,
  Button,
  HStack,
  IconButton,
  Link as ChakraLink,
  Icon,
} from '@chakra-ui/react'
import { useAsync } from '@react-hook/async'
import { FaDiscord, FaGithub } from 'react-icons/fa'
import { MdArrowBack } from 'react-icons/md'
import { Link } from 'react-router-dom'
import { GITHUB_URL } from '../LandingPage'

import logoWithBorderURL from '../logoWithBorder.svg'

export default function Settings({
  isShowing,
  onClose,
}: {
  isShowing: boolean
  onClose: () => void
}) {
  const { colorMode, toggleColorMode } = useColorMode()

  const [{ status: dumpStatus }, doDumpDB] = useAsync(async () => {
    const { dumpDB } = await import('../utils/dumpDB')
    await dumpDB()
  })

  return (
    <Modal isOpen={isShowing} onClose={onClose} size="full">
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
        <ModalCloseButton left="3" right="auto">
          <Icon as={MdArrowBack} fontSize="2xl" />
        </ModalCloseButton>
        <ModalBody display="flex" flexDir="column" alignItems="center">
          <VStack spacing="4" mt="16">
            <Image src={logoWithBorderURL} w="48" h="48" mx="auto" />
            <Text textStyle="brand" fontSize="5xl">
              TIME THIEF
            </Text>
          </VStack>
          <VStack flex="1" mt={{ base: 8, lg: 16 }} spacing="8">
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
            <Button
              as={Link}
              to="/app/settings/experiments"
              size="sm"
              variant="ghost"
            >
              Experiments
            </Button>
          </VStack>
          <VStack mt="8" mb="2" spacing="4">
            <HStack spacing="2" opacity=".75">
              <IconButton
                as={ChakraLink}
                href={GITHUB_URL}
                icon={<FaGithub />}
                fontSize="3xl"
                aria-label="Github"
                variant="ghost"
              />
              <IconButton
                as={ChakraLink}
                href="/discord"
                icon={<FaDiscord />}
                fontSize="3xl"
                aria-label="Github"
                variant="ghost"
              />
            </HStack>
            <Text opacity=".5">
              {process.env.NODE_ENV === 'development'
                ? 'development'
                : process.env.REACT_APP_VERSION}
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
