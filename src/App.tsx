import {
  ChakraProvider,
  Container,
  Flex,
  IconButton,
  LightMode,
  SimpleGrid,
  useColorMode,
  useLatestRef,
  usePrevious,
  VStack,
} from '@chakra-ui/react'
import '@fontsource/roboto-flex/variable-full.css'
import useSize from '@react-hook/size'
import 'focus-visible/dist/focus-visible'
import {
  AnimatePresence,
  useAnimation,
  useDragControls,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { MdArticle } from 'react-icons/md'
import './App.css'
import Activity from './components/Activity'
import ActivityPips from './components/ActivityPips'
import Carousel from './components/Carousel'
import Log from './components/Log'
import MotionBox from './components/MotionBox'
import {
  parseIdxFromEntityId,
  useManualEntities,
} from './components/useActivityDB'
import useLongPress from './utils/useLongPress'
import { Provider as PouchProvider } from 'use-pouchdb'
import { _db } from '.'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { appTheme } from './theme'
import Settings from './components/Settings'
import NUXMessage from './components/NUXMessage'
import { ActivityRemainingTime } from './components/RemainingTime'
import { atom, useAtom, useSetAtom } from 'jotai'
import PageArrows from './components/PageArrows'
import { useActivities } from './components/useActivities'

// For now, we sync router state to the atom. Would be cool to someday use
// Jotai for more route state control. Use separate atoms to prevent infinite loops.
const actualPageAtom = atom(0)
const destPageAtom = atom<number | null>(null)
export const activityPageAtom = atom(
  (get) => get(actualPageAtom),
  (_, set, update: number) => {
    set(destPageAtom, update)
  },
)

function useRouteState({
  maxPages,
  isShowingLog,
}: {
  maxPages: number
  isShowingLog: boolean
}) {
  const location = useLocation()
  const navigate = useNavigate()

  const setActualPageAtom = useSetAtom(actualPageAtom)
  const [destPageFromAtom, setDestPageAtom] = useAtom(destPageAtom)

  const { pathname, search } = location
  const prevPathname = usePrevious(pathname)
  const locationHashPage = parseInt(location.hash.substring(1))
  const page =
    Number.isInteger(locationHashPage) &&
    locationHashPage > 0 &&
    locationHashPage <= maxPages
      ? locationHashPage
      : 0

  const setPage = useCallback(
    (nextPage: number) => {
      navigate(`${search}#${nextPage}`, { replace: true })
      setActualPageAtom(nextPage)
    },
    [navigate, search, setActualPageAtom],
  )

  useEffect(() => {
    if (destPageFromAtom !== null && page !== destPageFromAtom) {
      setPage(destPageFromAtom)
      setDestPageAtom(null)
    }
  }, [destPageFromAtom, page, setDestPageAtom, setPage])

  const setShowingLog = useCallback(
    (newShowingLog: boolean) => {
      if (newShowingLog && !isShowingLog) {
        navigate(`/app/log${search}#${page}`)
      } else if (!newShowingLog && isShowingLog) {
        if (prevPathname === '/app' || prevPathname === '/app/settings') {
          navigate(-1)
        } else {
          navigate(`/app${search}#${page}`, { replace: true })
        }
      }
    },
    [isShowingLog, navigate, page, prevPathname, search],
  )

  const dismissSettings = useCallback(() => {
    if (prevPathname === '/app/log') {
      navigate(-1)
    } else {
      navigate(`/app/log`, { replace: true })
    }
  }, [navigate, prevPathname])

  return { page, setPage, setShowingLog, dismissSettings }
}

export const demoSwipeAtom = atom<boolean | null>(null)

function useDemoSwipes(
  isDemo: boolean,
  page: number,
  pageCount: number,
  setPage: (num: number) => void,
) {
  const [demoSwipeValue, setDemoSwipeValue] = useAtom(demoSwipeAtom)
  const isDemoingSwipes = demoSwipeValue ?? isDemo

  const dirRef = useRef(1)
  const pageRef = useLatestRef(page)

  useEffect(() => {
    if (!isDemoingSwipes) {
      return
    }
    const interval = setInterval(() => {
      const curPage = pageRef.current
      if (curPage === pageCount - 1) {
        dirRef.current = -1
      } else if (curPage === 0) {
        dirRef.current = 1
      }
      setPage(curPage + dirRef.current)
    }, 2500)
    return () => {
      clearInterval(interval)
    }
  }, [isDemoingSwipes, pageCount, pageRef, setPage])

  const stopDemoSwipes = useCallback(() => {
    setDemoSwipeValue(false)
  }, [setDemoSwipeValue])
  return stopDemoSwipes
}

function ActivityContainer({ children }: { children: ReactNode }) {
  return (
    <Flex w="100vw" h="full" flexShrink="0">
      <Container w="full" maxW="container.lg">
        {children}
      </Container>
    </Flex>
  )
}

function App({
  isDemo,
  isShowingLog,
  isShowingSettings,
}: {
  isDemo: boolean
  isShowingLog: boolean
  isShowingSettings: boolean
}) {
  const { colorMode } = useColorMode()
  const { activities, manualActivity, seed } = useActivities()
  const {
    manualEntityIds,
    manualEntityDraftId,
    manualEntitiesLoaded,
    createManualDraft,
    cleanupManualDraft,
  } = useManualEntities({
    seed,
    manualActivity,
  })
  const ref = useRef<HTMLDivElement>(null)
  const [width = 0, height = 0] = useSize(ref)

  const pageCount =
    activities.length + manualEntityIds.length - (manualEntityDraftId ? 1 : 0)
  const { page, setPage, setShowingLog, dismissSettings } = useRouteState({
    maxPages: pageCount,
    isShowingLog,
  })

  const stopDemoSwipes = useDemoSwipes(isDemo, page, pageCount, setPage)

  const dragControls = useDragControls()
  const dragMotionValue = useMotionValue(0)
  const dragDraftRange = [-(pageCount - 1) * width, -pageCount * width]
  const dragProgressMotionValue = useTransform(
    dragMotionValue,
    dragDraftRange,
    [0, 1],
  )

  const dragLogControls = useDragControls()
  const slideLog = useAnimation()
  const [isDraggingLog, setDraggingLog] = useState(false)

  const blur = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }, [])

  const logLongPressProps = useLongPress(() => {
    localStorage['syncEndpoint'] = window.prompt(
      'sync endpoint',
      localStorage['syncEndpoint'] ?? '',
    )
  })

  const handleStartDrag = useCallback(
    (event: React.PointerEvent) => {
      stopDemoSwipes()
      dragControls.start(event)
    },
    [dragControls, stopDemoSwipes],
  )

  const handleStartLogDrag = useCallback(
    (event: React.TouchEvent) => {
      dragLogControls.start(event)
    },
    [dragLogControls],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      // TODO: unify jotai page state and route
      // (trigger route on jotai state changes)
      setPage(page)
      blur()
      if (page < pageCount - 1) {
        cleanupManualDraft()
      }
    },
    [blur, cleanupManualDraft, pageCount, setPage],
  )

  const handleCreateManualEntity = useCallback(() => {
    createManualDraft()
    setPage(page + 1)
  }, [createManualDraft, page, setPage])

  const prevPage = useCallback(() => {
    setPage(page - 1)
  }, [page, setPage])

  const nextPage = useCallback(() => {
    setPage(page + 1)
  }, [page, setPage])

  useEffect(() => {
    slideLog.start(isShowingLog ? 'open' : 'closed')
  }, [isShowingLog, slideLog])

  const ready = width !== 0 && activities.length > 0 && manualEntitiesLoaded

  const activityContent = useMemo(
    () => [
      ...activities.map((activity, idx) => (
        <Activity
          key={`${seed}-${idx}-${activity.id}`}
          activity={activity}
          seed={seed}
          idx={idx}
        />
      )),
      ...manualEntityIds.map((id) => (
        <Activity
          key={id}
          activity={manualActivity}
          seed={seed}
          idx={parseIdxFromEntityId(id)}
        />
      )),
    ],
    [activities, manualActivity, manualEntityIds, seed],
  )

  const backgroundColor = colorMode === 'dark' ? 'primary.800' : 'primary.50'

  // FIXME: ignore multiple touch drags
  // TODO: ARIA tabs accessibility
  return (
    <>
      <Flex ref={ref} h="full" flexDir="column" background={backgroundColor}>
        <VStack
          w="100vw"
          h="full"
          color={colorMode === 'dark' ? 'primary.100' : 'primary.600'}
          spacing="4"
          overflow="hidden"
        >
          <Flex
            flex="1"
            w="full"
            position="relative"
            onPointerDown={handleStartDrag}
          >
            {ready && (
              <AnimatePresence initial={false} exitBeforeEnter>
                <MotionBox
                  key={seed}
                  position="absolute"
                  inset="0"
                  display="flex"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.25, ease: 'easeOut' },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 1.05,
                    transition: { duration: 0.25, ease: 'easeOut' },
                  }}
                >
                  <Carousel
                    width={width}
                    page={page}
                    dragMotionValue={dragMotionValue}
                    dragControls={dragControls}
                    onPageChange={handlePageChange}
                    onDragToLastPage={handleCreateManualEntity}
                    lastPage={
                      manualActivity &&
                      !manualEntityDraftId && (
                        <ActivityContainer>
                          <Activity
                            key="manual-draft"
                            activity={manualActivity}
                            seed={seed}
                            idx={activities.length}
                          />
                        </ActivityContainer>
                      )
                    }
                  >
                    {activityContent.map((child) => (
                      <ActivityContainer key={child.key}>
                        {child}
                      </ActivityContainer>
                    ))}
                  </Carousel>
                </MotionBox>
              </AnimatePresence>
            )}
          </Flex>
          <SimpleGrid
            flexShrink="0"
            columns={3}
            h="10vh"
            minH="12"
            w="full"
            maxW="container.lg"
            px="8"
            alignItems="center"
            justifyContent="space-around"
            onTouchStart={handleStartLogDrag}
            sx={{ touchAction: 'none' }}
          >
            <ActivityRemainingTime justifySelf="start" />
            <ActivityPips
              activityCount={activities.length}
              page={page}
              lastPage={pageCount}
              opacity={ready ? 1 : 0}
              dragProgressMotionValue={dragProgressMotionValue}
              onGotoPage={setPage}
              onCreateManualEntity={handleCreateManualEntity}
            />
            <IconButton
              zIndex="overlay"
              icon={<MdArticle />}
              aria-label="View log"
              justifySelf="end"
              variant={isShowingLog || isDraggingLog ? 'solid' : 'ghost'}
              fontSize="3xl"
              onClick={() => {
                setShowingLog(!isShowingLog)
              }}
              borderColor={backgroundColor}
              borderWidth="1.5px"
              boxSizing="content-box"
              borderRadius="full"
              size="lg"
              mr="-2"
              {...logLongPressProps}
            />
          </SimpleGrid>
        </VStack>
        {!isDemo && <NUXMessage />}
        <PageArrows
          page={page}
          pageCount={pageCount}
          nextPage={nextPage}
          prevPage={prevPage}
        />
      </Flex>
      {ready && (
        <MotionBox
          position="absolute"
          top="0"
          left="0"
          w="full"
          h="full"
          bg={colorMode === 'dark' ? 'primary.800' : 'primary.50'}
          boxShadow="dark-lg"
          drag="y"
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: height + 10 }}
          dragControls={dragLogControls}
          transition={{
            y: { type: 'spring', duration: 0.5, bounce: 0 },
          }}
          variants={{
            open: { y: 0, opacity: 1 },
            closed: { y: height, opacity: 0 },
          }}
          whileDrag={{ opacity: 1 }}
          animate={slideLog}
          initial={isShowingLog ? 'open' : 'closed'}
          onDirectionLock={(axis) => {
            if (axis === 'y') {
              setDraggingLog(true)
            }
          }}
          onDragEnd={(ev, { offset, velocity }) => {
            const velocityThreshold = 5000
            const threshold = 30
            const swipe = Math.abs(offset.y) * velocity.y

            let showingLog = isShowingLog
            if (swipe > velocityThreshold) {
              showingLog = false
            } else if (swipe < -velocityThreshold || offset.y < -threshold) {
              showingLog = true
            }

            slideLog.start(showingLog ? 'open' : 'closed')
            setShowingLog(showingLog)
            setDraggingLog(false)
          }}
          pointerEvents={isShowingLog ? 'auto' : 'none'}
        >
          <Log />
        </MotionBox>
      )}
      <Settings isShowing={isShowingSettings} onClose={dismissSettings} />
    </>
  )
}

type BeforeInstallPromptEvent = Event & { prompt: () => void }
export const installPromptEventAtom = atom<BeforeInstallPromptEvent | null>(
  null,
)

function AppWrapper({
  isShowingLog,
  isShowingSettings,
}: {
  isShowingLog?: boolean
  isShowingSettings?: boolean
}) {
  const [searchParams] = useSearchParams()
  const isDemo = searchParams.has('demo')

  const setPromptEvent = useSetAtom(installPromptEventAtom)

  useEffect(() => {
    function handleInstallPrompt(ev: Event) {
      // TODO: use a real type def for event
      setPromptEvent(ev as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
    }
  }, [setPromptEvent])

  let content = (
    <App
      isDemo={isDemo}
      isShowingLog={isShowingLog === true}
      isShowingSettings={isShowingSettings === true}
    />
  )
  if (isDemo) {
    content = <LightMode>{content}</LightMode>
  }

  return (
    <PouchProvider pouchdb={_db}>
      <ChakraProvider theme={appTheme}>{content}</ChakraProvider>
    </PouchProvider>
  )
}

export default AppWrapper
