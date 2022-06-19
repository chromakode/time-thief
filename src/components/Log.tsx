import {
  AspectRatio,
  Box,
  Flex,
  Heading,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Spacer,
  Text,
  VStack,
} from '@chakra-ui/react'
import dayjs from 'dayjs'
import { groupBy, isEmpty, partition, reverse } from 'lodash'
import React, { useCallback } from 'react'
import { MdInfo, MdMoreVert } from 'react-icons/md'
import { useAllDocs, usePouch } from 'use-pouchdb'
import AttachmentImage from './AttachmentImage'
import Markdown from './content/Markdown'

function formatDate(date: Date) {
  return dayjs(date).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: '[Last] dddd',
    sameElse: 'MMMM D, YYYY',
  })
}

function LogMenu({ entity }: { entity: any }) {
  const db = usePouch()
  const handleDelete = useCallback(() => {
    db.remove(entity)
  }, [db, entity])
  return (
    <Menu variant="logActions" placement="right" preventOverflow={false} isLazy>
      <MenuButton
        as={IconButton}
        aria-label="Actions"
        icon={<MdMoreVert />}
        variant="ghost"
        size="xs"
        fontSize="xl"
        color="inherit"
        opacity=".4"
        _expanded={{
          opacity: '1',
          _dark: {
            bg: 'primary.700',
          },
          _light: {
            bg: 'primary.100',
          },
        }}
      />
      <MenuList minWidth="auto">
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </MenuList>
    </Menu>
  )
}

function LogDay({ dateText, docs }: { dateText: string; docs: any[] }) {
  const chronoDocs = reverse([...docs])
  const [photos, etc] = partition(chronoDocs, (doc) =>
    doc.hasOwnProperty('_attachments'),
  )
  const startTime = dayjs(docs[0].created).endOf('day')
  return (
    <VStack align="flex-start" w="full" spacing="4">
      <Flex dir="row" w="full" alignItems="center">
        <Heading as="h2" size="lg" textStyle="title">
          {dateText}{' '}
        </Heading>
        <Spacer />
        {dayjs().diff(startTime, 'day') > 0 && (
          <Text opacity=".75">{startTime.fromNow()}</Text>
        )}
      </Flex>
      <VStack align="flex-start" spacing="6" w="full">
        <SimpleGrid columns={2} spacing="1" w="full">
          {photos.map((entity) => (
            <AspectRatio key={entity._id} ratio={1}>
              <AttachmentImage
                docId={entity._id}
                attachmentId="photo"
                digest={entity._attachments['photo'].digest}
                borderRadius="4"
                w="full"
                h="full"
                objectFit="cover"
              />
            </AspectRatio>
          ))}
        </SimpleGrid>
        {etc
          .filter((entity) => entity.content)
          .map((entity) => {
            return (
              <VStack key={entity._id} align="flex-start">
                <HStack spacing="1.5">
                  <Text whiteSpace="nowrap" opacity=".75">
                    {dayjs(entity.created).format('h:mm a')}
                  </Text>
                  <LogMenu entity={entity} />
                </HStack>
                <Heading as="h3" size="md" textStyle="title">
                  <Markdown>{entity.title}</Markdown>
                </Heading>
                <Text fontSize="lg">{entity.content}</Text>
              </VStack>
            )
          })}
      </VStack>
    </VStack>
  )
}

export default function Log({ onShowAbout }: { onShowAbout: () => void }) {
  const { rows } = useAllDocs<any>({
    include_docs: true,
    descending: true,
    limit: 500, // TODO paginate / virtualize list
  })

  const beforeDate = dayjs().startOf('day')
  const byDate = groupBy(
    rows.filter(
      (row) => !row.id.startsWith('$') && row.doc.created < beforeDate,
    ),
    (row) => formatDate(row.doc?.created),
  )

  // TODO: use content component system to render log
  return (
    <Box position="relative" h="full" overflowY="scroll">
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
      {isEmpty(byDate) ? (
        // TODO: an art would be nice here
        <VStack fontSize="3xl" m="8" spacing="8" mt="20vh" align="flex-start">
          <Text>After your first day, your journal will appear here. 🌟</Text>
          <Text>Keep writing!</Text>
        </VStack>
      ) : (
        <VStack align="flex-start" padding="4" spacing="8">
          {Object.entries(byDate).map(([dateText, rows]) => (
            <LogDay
              key={dateText}
              dateText={dateText}
              docs={rows.map((row) => row.doc)}
            />
          ))}
        </VStack>
      )}
    </Box>
  )
}
