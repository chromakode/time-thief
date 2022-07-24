import {
  Box,
  Flex,
  Link,
  Image,
  Text,
  HStack,
  VStack,
  Container,
  AspectRatio,
  Button,
  Divider,
  Icon,
  Stack,
} from '@chakra-ui/react'
import { MdLock } from 'react-icons/md'
import { FaDiscord, FaGithub } from 'react-icons/fa'
import logoURL from './logoWithBorder.svg'
import { ReactNode } from 'react'

const GITHUB_URL = 'https://github.com/chromakode/time-thief'

function FAQItem({ title, children }: { title: string; children: ReactNode }) {
  return (
    <VStack alignItems="flex-start">
      <Text as="h3" textStyle="hero" fontSize="xl">
        {title}
      </Text>
      <Text fontSize="lg" fontWeight="500">
        {children}
      </Text>
    </VStack>
  )
}

function ExternalLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link href={href} color="primary.500" fontWeight="bold" isExternal>
      {children}
    </Link>
  )
}

const commonMargin = { base: '8', xl: '20' }
const commonTopSpace = { base: '14', xl: '20' }

export default function LandingPage() {
  return (
    <Box bgColor="lightBeige" minH="full">
      <Box
        as="header"
        display="flex"
        bgColor="beige"
        borderBottomColor="primary.100"
        borderBottomWidth="2px"
        height={{ base: '32rem', xl: '38rem' }}
        w="full"
      >
        <Container
          maxW="container.xl"
          position="relative"
          display="flex"
          flexDir="column"
        >
          <Flex
            ml={{ xl: '16' }}
            alignItems="center"
            justifyContent={{ base: 'center', xl: 'flex-start' }}
          >
            <Link
              href="/"
              display="inline-flex"
              position="relative"
              w="auto"
              px="4"
            >
              <Box
                pos="absolute"
                inset="0"
                bgColor="primary.600"
                transform="skew(-8deg)"
              />
              <Text
                textStyle="brand"
                fontSize={{ base: 'xl', xl: '3xl' }}
                color="primary.50"
                zIndex="1"
              >
                TIME THIEF
              </Text>
            </Link>
            <Text textStyle="slant" fontSize="md" color="primary.600" ml="3">
              EARLY BETA
            </Text>
          </Flex>
          <Stack
            flex="1"
            ml={{ xl: '12' }}
            mb={{ md: '12' }}
            spacing="6"
            position="relative"
            alignItems="center"
            justifyContent={{ base: 'center', xl: 'flex-start' }}
            direction={{ base: 'column', md: 'row' }}
          >
            <AspectRatio ratio={1} w={{ base: '36', md: '200px' }}>
              <Image src={logoURL} />
            </AspectRatio>
            <Flex
              flexDir="column"
              align={{ base: 'center', md: 'flex-start' }}
              fontSize={{ base: '4xl', md: '3.35rem' }}
              color="black"
              lineHeight="125%"
              textStyle="hero"
            >
              <Text>
                Stop{' '}
                <Text as="span" color="inverse">
                  Doomscrolling
                </Text>
                .
              </Text>
              <Text>
                Start{' '}
                <Text as="span" color="primary.500">
                  Journaling
                </Text>
                .
              </Text>
              <Button
                as="a"
                href="/app"
                position={{ md: 'absolute' }}
                mt="8"
                bottom={{ base: '10', xl: '16' }}
                bgColor="primary.600"
                color="primary.50"
                fontSize={{ base: '2xl', md: '4xl' }}
                textStyle="hero"
                px={{ base: '4', md: '8' }}
                py={{ base: '6', md: '8' }}
                borderRadius={{ base: 'lg', md: 'xl' }}
              >
                Launch App
              </Button>
            </Flex>
          </Stack>
          <Box
            display={{ base: 'none', xl: 'block' }}
            position="absolute"
            top="20"
            right="20"
            borderWidth="3px"
            borderBottomWidth="0"
            borderColor="primary.600"
            borderRadius="6px"
            overflow="hidden"
          >
            <AspectRatio maxW="350px" w="28vw" ratio={1 / 2}>
              <iframe src="/app?demo" title="TIME THIEF Preview" />
            </AspectRatio>
            <Text
              bgColor="primary.600"
              color="primary.25"
              fontSize="sm"
              fontWeight="600"
              textAlign="center"
              py="1"
            >
              This is a live preview. Go ahead, write your first note!
            </Text>
          </Box>
        </Container>
      </Box>
      <Container maxW="container.xl" color="primary.700" p="0">
        <VStack
          mx={commonMargin}
          py={commonTopSpace}
          width={{ xl: '40rem' }}
          alignItems="flex-start"
          fontSize="xl"
          fontWeight="600"
          spacing="6"
        >
          <Text as="h2">
            <Text
              as="span"
              textStyle="brand"
              color="primary.600"
              fontSize="3xl"
              mr="1"
            >
              TIME THIEF
            </Text>{' '}
            is a journal for the moments in between moments.
          </Text>
          <Text>
            It's hard to find time to journal, but easy to lose hours on your
            phone.
          </Text>
          <Text>It's time to take that time back.</Text>
        </VStack>
        <Divider borderColor="primary.100" borderWidth="1px" />
        <VStack
          mx={commonMargin}
          py={commonTopSpace}
          alignItems="flex-start"
          color="primary.700"
          fontSize="lg"
          fontWeight={{ base: '500', xl: '600' }}
          spacing="12"
        >
          <VStack alignItems="flex-start" spacing="2">
            <Text as="h2" textStyle="hero" fontSize="2xl">
              How it works:{' '}
              <Text as="span" color="primary.500">
                every 15 minutes, you get 3 prompts
              </Text>
              .
            </Text>
            <Text>
              They vary by time of day, and some build off previous ones.
            </Text>
            <Text>
              Don't overthink it &mdash; jot something in the ones that interest
              you.
            </Text>
            <HStack>
              <Icon as={MdLock} boxSize="6" />
              <Text>
                Your journal is stored privately and never leaves your device.
              </Text>
            </HStack>
          </VStack>
          <VStack alignItems="flex-start" spacing="2">
            <Text as="h2" textStyle="hero" fontSize="2xl">
              Cultivate a{' '}
              <Text as="span" color="primary.500">
                journaling habit
              </Text>
              .
            </Text>
            <Text>
              To get the most out of TIME THIEF, open it when you catch yourself
              wasting time on your phone
            </Text>
            <Text>
              Tip: Try replacing an app on your home screen you reach for when
              you're bored.
            </Text>
          </VStack>
          <Stack
            spacing="6"
            direction={{ base: 'column', md: 'row' }}
            w={{ base: 'full', md: 'auto' }}
          >
            {[
              {
                icon: FaGithub,
                label: 'Proudly free and open-source',
                href: GITHUB_URL,
              },
              { icon: FaDiscord, label: 'Join the Discord', href: '/discord' },
            ].map(({ icon, label, href }) => (
              <Button
                key={href}
                as="a"
                href={href}
                target="_blank"
                bgColor="primary.50"
                _hover={{ bgColor: 'primary.100' }}
                color="primary.700"
                fontSize="lg"
                py="6"
                borderRadius="lg"
                leftIcon={<Icon as={icon} fontSize="3xl" />}
              >
                {label}
              </Button>
            ))}
          </Stack>
        </VStack>
        <Divider borderColor="primary.100" borderWidth="1px" />
        <VStack
          mx={commonMargin}
          py={commonTopSpace}
          maxW="75ch"
          alignItems="flex-start"
          color="primary.700"
          fontSize="lg"
          fontWeight="600"
          lineHeight="tall"
          spacing="6"
        >
          <Text as="h2" textStyle="hero" fontSize="2xl">
            FAQ
          </Text>
          <VStack spacing="8" alignItems="flex-start">
            <FAQItem title="How do I install TIME THIEF?">
              TIME THIEF is distributed as a{' '}
              <ExternalLink href="https://web.dev/what-are-pwas/">
                Progressive Web App
              </ExternalLink>
              . In your browser of choice, you can install it to your home
              screen or desktop. Because TIME THIEF stores your journal on your
              own device, it does not require an internet connection to run.
            </FAQItem>
            <FAQItem title="What determines which prompts I see?">
              It depends on the time of day, prompts you've seen recently, and
              what you've written (some prompts build off past ones). Under the
              hood, there's an extensible rule system which determines which
              prompts you see. In the future, this will be customizable.
            </FAQItem>
            <FAQItem title="What does 'early beta' mean?">
              TIME THIEF is under active development. Its core feature set is
              fairly robust, but there will be occasional bugs and major changes
              ahead.
            </FAQItem>
            <FAQItem title="Who is developing TIME THIEF?">
              TIME THIEF is a personal project by{' '}
              <ExternalLink href="https://chromakode.com">
                Max Goodhart
              </ExternalLink>
              .
            </FAQItem>
            <FAQItem title="How can I give feedback?">
              Stop by the <ExternalLink href="/discord">Discord</ExternalLink>{' '}
              and say hello! I'd love to hear all about it.
            </FAQItem>
          </VStack>
        </VStack>
      </Container>
      <Box bgColor="primary.700" py="2">
        <Container
          maxW="container.xl"
          color="primary.50"
          px={commonMargin}
          display="flex"
        >
          <Text flex="1">
            &copy; 2022 <Link href="https://chromakode.com">Max Goodhart</Link>
          </Text>
          <HStack spacing="8">
            <Link href={GITHUB_URL}>GitHub</Link>
            <Link href="/discord">Discord</Link>
          </HStack>
        </Container>
      </Box>
    </Box>
  )
}
