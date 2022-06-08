import {
  AspectRatio,
  Heading,
  IconButton,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import { groupBy, partition, reverse } from 'lodash'
import React from 'react'
import { MdInfo } from 'react-icons/md'
import { useAllDocs } from 'use-pouchdb'
import dayjs from 'dayjs'
import AttachmentImage from './AttachmentImage'

function formatDate(date: Date) {
  return dayjs(date).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: '[Last] dddd',
    sameElse: 'MMMM D, YYYY',
  })
}

function LogDay({ dateText, docs }: { dateText: string; docs: any[] }) {
  const chronoDocs = reverse([...docs])
  const [photos, etc] = partition(chronoDocs, (doc) =>
    doc.hasOwnProperty('_attachments'),
  )
  return (
    <VStack align="flex-start" w="full" spacing="4">
      <Heading as="h2" size="lg" textStyle="title">
        {dateText}
      </Heading>
      <VStack align="flex-start" spacing="6" w="full">
        <SimpleGrid columns={2} spacing="1" w="full">
          {photos.map((entity) => (
            <AspectRatio key={entity._id} ratio={1}>
              <AttachmentImage
                docId={entity._id}
                attachmentId="photo"
                borderRadius="4"
              />
            </AspectRatio>
          ))}
        </SimpleGrid>
        {etc
          .filter((entity) => entity.content)
          .map((entity) => {
            return (
              <VStack key={entity._id} align="flex-start">
                <Text whiteSpace="nowrap" width="16">
                  {dayjs(entity.created).format('h:mm a')}
                </Text>
                <Heading as="h3" size="md" textStyle="title">
                  {entity.title}
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
    limit: 100, // TODO paginate / virtualize list
  })

  const byDate = groupBy(
    rows.filter((row) => !row.id.startsWith('$')),
    (row) => formatDate(row.doc?.created),
  )

  // TODO: use content component system to render log
  return (
    <>
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
      <VStack
        align="flex-start"
        h="full"
        overflowY="scroll"
        padding="4"
        spacing="8"
      >
        {Object.entries(byDate).map(([dateText, rows]) => (
          <LogDay
            key={dateText}
            dateText={dateText}
            docs={rows.map((row) => row.doc)}
          />
        ))}
      </VStack>
    </>
  )
}
