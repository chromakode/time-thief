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
} from '@chakra-ui/react'
import { MdArrowBack } from 'react-icons/md'
import CustomActivitiesExperiment from './CustomActivitiesExperiment'
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
          <VStack
            my="8"
            w="full"
            fontSize="lg"
            alignItems="stretch"
            spacing="12"
          >
            <VStack>
              <Heading size="xl">Here be dragons</Heading>
              <Text textAlign="center">
                These features are still under development and could cause bugs.
                Interested in testing or learning more? Ask on the{' '}
                <ChakraLink href="/discord" fontWeight="semibold">
                  Discord
                </ChakraLink>
                .
              </Text>
            </VStack>
            <SyncExperiment />
            <CustomActivitiesExperiment />
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
