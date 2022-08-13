import { Button, Heading, Input, Text, VStack } from '@chakra-ui/react'
import { useAtomValue } from 'jotai'
import React, { useCallback, useState } from 'react'
import { MdRefresh } from 'react-icons/md'
import { syncStateAtom } from '../components/useActivityDB'

function isValidSyncEndpoint(url: string) {
  return url.length === 0 || url.startsWith('https://')
}

export default function SyncExperiment() {
  const storedSyncEndpoint = localStorage['syncEndpoint'] ?? ''
  const [syncEndpointValid, setSyncEndpointValid] = useState(
    isValidSyncEndpoint(storedSyncEndpoint),
  )
  const [syncEndpointChanged, setSyncEndpointChanged] = useState(false)

  const handleSyncEndpointChanged = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const url = ev.target.value
      if (!isValidSyncEndpoint(url)) {
        setSyncEndpointValid(false)
        localStorage['syncEndpoint'] = ''
        return
      }
      localStorage['syncEndpoint'] = url
      setSyncEndpointValid(true)
      setSyncEndpointChanged(true)
    },
    [],
  )

  const handleReload = useCallback(() => {
    window.location.reload()
  }, [])

  const syncState = useAtomValue(syncStateAtom)
  return (
    <VStack spacing="4">
      <VStack alignItems="flex-start">
        <Heading size="lg">Sync &amp; Backup</Heading>
        <Text>Automatically back up your journal to a remote server.</Text>
        <Input
          type="url"
          placeholder="https://..."
          variant="filled"
          w="full"
          onChange={handleSyncEndpointChanged}
          defaultValue={storedSyncEndpoint}
          isInvalid={!syncEndpointValid}
        />
        <Text fontSize="md" fontWeight="medium">
          Warning: the remote server will be able to read your notes. In the
          future, encryption will be added.
        </Text>
        {syncState !== null && (
          <Text fontSize="md">Sync status: {syncState}</Text>
        )}
      </VStack>
      {syncEndpointChanged && (
        <Button
          leftIcon={<MdRefresh />}
          size="sm"
          onClick={handleReload}
          mt="2"
        >
          Reload to apply
        </Button>
      )}
    </VStack>
  )
}
