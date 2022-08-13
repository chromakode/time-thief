import { Heading, Text, Textarea, VStack } from '@chakra-ui/react'

export default function CustomActivitiesExperiment() {
  return (
    <VStack alignItems="flex-start">
      <Heading size="lg">Custom Prompts</Heading>
      <Text>
        Write your own custom prompts using{' '}
        <Text as="span" textStyle="brand">
          TIME THIEF
        </Text>
        's rules engine.
      </Text>
      <Textarea h="32" placeholder="Coming soon." variant="filled" disabled />
    </VStack>
  )
}
