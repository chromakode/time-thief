import { Button, Heading, Input, Text, VStack } from '@chakra-ui/react'
import { useAsync } from '@react-hook/async'
import { useAtomValue } from 'jotai'
import React, { useCallback, useState } from 'react'
import { MdRefresh } from 'react-icons/md'
import { usePouch } from 'use-pouchdb'
import { authorNameAtom } from '../components/useActivityDB'
import { getClientId } from '../utils/getClientId'

export default function MultiplayerExperiment() {
  const db = usePouch()
  const authorName = useAtomValue(authorNameAtom)
  const [newAuthorName, setNewAuthorName] = useState<string | null | undefined>(
    undefined,
  )

  const handleAuthorNameChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const text = ev.target.value
      setNewAuthorName(text === '' ? null : text)
    },
    [],
  )

  const [, handleApplyAuthorName] = useAsync(async () => {
    const docId = `$client/${getClientId()}`
    let clientInfo
    try {
      clientInfo = await db.get(docId)
    } catch {}
    await db.put({ ...clientInfo, _id: docId, authorName: newAuthorName })
    window.location.reload()
  })

  return (
    <VStack spacing="4">
      <VStack alignItems="flex-start" w="full">
        <Heading size="md">Multiplayer</Heading>
        <Text>
          Collaborate on a synced journal with others! Safer than a vulcan mind
          meld.
        </Text>
        <Input
          type="url"
          placeholder="Your name (short and semi-permanent)"
          variant="filled"
          w="full"
          defaultValue={authorName ?? ''}
          onChange={handleAuthorNameChange}
        />
      </VStack>
      {newAuthorName !== undefined && newAuthorName !== authorName && (
        <Button
          leftIcon={<MdRefresh />}
          size="sm"
          mt="2"
          onClick={handleApplyAuthorName}
        >
          Reload to apply
        </Button>
      )}
    </VStack>
  )
}
