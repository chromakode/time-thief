import {
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useColorMode,
  VStack,
  Link as ChakraLink,
  Text,
  Heading,
  Container,
} from '@chakra-ui/react'
import { MdArrowBack } from 'react-icons/md'
import CustomActivitiesExperiment from './CustomActivitiesExperiment'
import MultiplayerExperiment from './MultiplayerExperiment'
import SyncExperiment from './SyncExperiment'

export default function Settings({
  isShowing,
  onClose,
}: {
  isShowing: boolean
  onClose: () => void
}) {
  const { colorMode } = useColorMode()

  return (
    <Modal isOpen={isShowing} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          py="2"
          textAlign="center"
          borderBottomWidth="1px"
          borderBottomColor={
            colorMode === 'dark' ? 'primary.900' : 'primary.100'
          }
        >
          Experimental Features
        </ModalHeader>
        <ModalCloseButton left="3" right="auto">
          <Icon as={MdArrowBack} fontSize="2xl" />
        </ModalCloseButton>
        <ModalBody display="flex" flexDir="column" alignItems="center">
          <Container maxW="container.lg">
            <VStack
              my="8"
              w="full"
              fontSize="lg"
              alignItems="stretch"
              spacing="8"
            >
              <VStack
                borderColor="primary.200"
                borderWidth="1px"
                p={{ base: '4', xl: '6' }}
              >
                <Heading size="xl">Here be dragons</Heading>
                <Text textAlign="center">
                  These features are not final and could be buggy. Interested in
                  testing or learning more? Ask on the{' '}
                  <ChakraLink href="/discord" fontWeight="semibold">
                    Discord
                  </ChakraLink>
                  .
                </Text>
              </VStack>
              <SyncExperiment />
              <MultiplayerExperiment />
              <CustomActivitiesExperiment />
            </VStack>
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
