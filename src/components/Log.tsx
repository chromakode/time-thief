import {
  AspectRatio,
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  useColorMode,
  VStack,
} from '@chakra-ui/react'
import useIntersectionObserver from '@react-hook/intersection-observer'
import dayjs from 'dayjs'
import { groupBy, isEmpty, reverse, throttle } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MdMoreVert, MdSettings } from 'react-icons/md'
import { Link } from 'react-router-dom'
import { useAllDocs, usePouch } from 'use-pouchdb'
import AttachmentImage from './AttachmentImage'
import Markdown from './Markdown'

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

function LogDay({
  dateText,
  docs,
  preRender,
}: {
  dateText: string
  docs: any[]
  preRender?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isIntersecting, boundingClientRect } = useIntersectionObserver(
    containerRef,
    { rootMargin: '1000px 0px 1000px 0px' },
  )
  const chronoDocs = reverse([...docs])
  const startTime = dayjs(docs[0].created).endOf('day')

  const content = useMemo(
    () =>
      preRender || isIntersecting ? (
        <>
          <Flex
            dir="row"
            w="full"
            alignItems="center"
            position="sticky"
            top="0"
            pt="4"
            pb="2"
            _dark={{ bg: 'primary.800' }}
            _light={{ bg: 'primary.50' }}
            zIndex="sticky"
          >
            <Heading as="h2" size="lg" textStyle="title">
              {dateText}
            </Heading>
            <Spacer />
            {dayjs().diff(startTime, 'day') > 0 && (
              <Text opacity=".75">{startTime.fromNow()}</Text>
            )}
          </Flex>
          <VStack align="flex-start" spacing="6" w="full">
            {chronoDocs.map((entity) => (
              <VStack key={entity._id} align="flex-start" w="full">
                <HStack spacing="1.5">
                  <Text whiteSpace="nowrap" opacity=".75" userSelect="all">
                    {dayjs(entity.created).format('h:mm a')}
                  </Text>
                  <LogMenu entity={entity} />
                </HStack>
                {entity.title && (
                  <Heading as="h3" size="md" textStyle="title" userSelect="all">
                    <Markdown>{entity.title}</Markdown>
                  </Heading>
                )}
                {entity.content && (
                  <Text fontSize="lg" whiteSpace="pre-wrap" userSelect="all">
                    {entity.content}
                  </Text>
                )}
                {entity._attachments?.['photo'] && (
                  <AspectRatio
                    ratio={entity.photo.width / entity.photo.height}
                    w="full"
                  >
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
                )}
              </VStack>
            ))}
          </VStack>
        </>
      ) : (
        <Box h={boundingClientRect?.height ?? '100vh'} />
      ),
    [
      preRender,
      isIntersecting,
      dateText,
      startTime,
      chronoDocs,
      boundingClientRect?.height,
    ],
  )

  return (
    <VStack ref={containerRef} align="flex-start" w="full">
      {content}
    </VStack>
  )
}

export default function Log({ onShowAbout }: { onShowAbout: () => void }) {
  const { colorMode } = useColorMode()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const { isIntersecting: isEndIntersecting } = useIntersectionObserver(
    endRef,
    { rootMargin: '500px 0px 500px 0px' },
  )
  const [count, setCount] = useState(50)
  const { rows, loading, update_seq } = useAllDocs<any>({
    include_docs: true,
    descending: true,
    limit: count,
    update_seq: true,
  })

  const beforeDate = dayjs().startOf('day')
  const logContent = useMemo(
    () => {
      const byDate = groupBy(
        rows.filter(
          (row) => !row.id.startsWith('$') && row.doc.created < beforeDate,
        ),
        (row) => formatDate(row.doc?.created),
      )
      return !loading && isEmpty(byDate) ? (
        // TODO: an art would be nice here
        <VStack
          fontSize="3xl"
          color={colorMode === 'dark' ? 'primary.100' : 'primary.700'}
          m="8"
          spacing="8"
          mt="20vh"
          align="flex-start"
        >
          <Text>After your first day, your journal will appear here. 🌟</Text>
          <Text>Keep writing!</Text>
        </VStack>
      ) : (
        <VStack align="flex-start" px="4" spacing="8">
          {Object.entries(byDate).map(([dateText, rows], idx) => (
            <LogDay
              key={dateText}
              dateText={dateText}
              docs={rows.map((row) => row.doc)}
              preRender={idx === 0}
            />
          ))}
        </VStack>
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [beforeDate.toNow(), update_seq, rows.length],
  )

  const loadMore = useMemo(
    () =>
      throttle(() => {
        setCount((count) => count + 50)
      }, 1000),
    [],
  )

  useEffect(() => {
    if (!loading && count === rows.length && isEndIntersecting) {
      loadMore()
    }
  }, [loading, isEndIntersecting, loadMore, count, rows.length])

  // Prevent scroll when swiping down so drag gesture handler can take effect
  useEffect(() => {
    const scroller = scrollerRef.current
    let touchStartY = 0

    function handleTouchStart(ev: TouchEvent) {
      touchStartY = ev.touches[0].clientY
    }

    function handleTouchMove(ev: TouchEvent) {
      const delta = ev.touches[0].clientY - touchStartY
      if (ev.cancelable && scroller?.scrollTop === 0 && delta > 1) {
        ev.preventDefault()
      }
    }

    scroller?.addEventListener('touchstart', handleTouchStart)
    scroller?.addEventListener('touchmove', handleTouchMove)
    return () => {
      scroller?.removeEventListener('touchstart', handleTouchStart)
      scroller?.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  // TODO: use content component system to render log
  return (
    <Box ref={scrollerRef} className="scroller" h="full" overflowY="scroll">
      <HStack
        position="relative"
        px="4"
        py="2"
        alignItems="center"
        justifyContent="center"
        borderBottomWidth="1px"
        borderBottomColor={colorMode === 'dark' ? 'primary.900' : 'primary.100'}
      >
        <Text textStyle="brand" fontSize="xl">
          TIME THIEF
        </Text>
        <Badge
          fontSize=".6rem"
          transform="skew(-8deg)"
          bg="primary.300"
          color="primary.25"
        >
          BETA
        </Badge>
        <IconButton
          as={Link}
          to="/app/settings"
          position="absolute"
          right="3"
          icon={<MdSettings />}
          aria-label="Settings"
          fontSize="lg"
          onClick={() => {}}
          variant="ghost"
          size="sm"
        />
      </HStack>
      {logContent}
      <Box ref={endRef} w="full" h="10vh" />
    </Box>
  )
}
