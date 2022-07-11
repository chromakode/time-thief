import { Flex, IconButton, VStack } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'
import { Ref, useCallback, useMemo, useRef, useState } from 'react'
import { MdArrowBack, MdArrowForward } from 'react-icons/md'
import contentComponents, {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'
import MotionBox from '../MotionBox'

export default function Steps(
  props: ContentComponentProps,
  ref: Ref<ContentComponentRef>,
) {
  const { spec, entityDoc, context } = props
  const [step, setStep] = useState(0)
  const [prevStep, setPrevStep] = useState(0)
  const componentRefs = useRef<ContentComponentRef[]>([])

  const leaveStep = useCallback(() => {
    for (const ref of componentRefs.current) {
      ref?.finalize?.()
    }
    componentRefs.current = []
  }, [])

  const goNext = useCallback(() => {
    leaveStep()
    setPrevStep(step)
    setStep(step + 1)
  }, [step, leaveStep])

  const goPrev = useCallback(() => {
    leaveStep()
    setPrevStep(step)
    setStep((step) => step - 1)
  }, [step, leaveStep])

  const stepSpec = spec.steps[step]

  const stepContent = stepSpec.map((item: any, idx: number) => {
    const Component = contentComponents.get(item.type)
    if (!Component) {
      console.warn('Unknown component type:', item.type)
      return undefined
    }
    return (
      <Component
        ref={(ref: ContentComponentRef) => {
          componentRefs.current[idx] = ref
        }}
        key={idx}
        {...props}
        spec={item}
        {...item}
      />
    )
  })

  const requiredFields = useMemo(
    () => new Set(spec.requiredFields || []),
    [spec.requiredFields],
  )
  const stepRequiredFields = stepSpec
    .map((c: any) => c.field)
    .filter((field: string) => field && requiredFields)
  const hasAllRequired = stepRequiredFields.every(
    (field: string) => entityDoc[field] || context[field]?._valid,
  )

  return (
    <Flex w="full" h="full" position="relative">
      <AnimatePresence initial={false}>
        <MotionBox
          key={step}
          position="absolute"
          inset="0"
          initial={{
            opacity: 0,
            x: step > prevStep ? 35 : -35,
            rotate: step > prevStep ? 0 : '-2deg',
          }}
          animate={{
            opacity: 1,
            x: 0,
            rotate: 0,
            transition: { type: 'spring', duration: 0.5 },
          }}
          exit={{
            opacity: 0,
            x: step > prevStep ? 35 : -35,
            rotate: step > prevStep ? 0 : '-2deg',
            transition: { type: 'spring', duration: 0.5 },
          }}
        >
          {step > 0 && (
            <IconButton
              position="absolute"
              left="4"
              top="4"
              onClick={goPrev}
              aria-label="Previous step"
              icon={<MdArrowBack />}
              fontSize="3xl"
              boxSize="10"
            />
          )}
          <VStack w="full" h="full">
            {stepContent}
            {step < spec.steps.length - 1 && (
              <IconButton
                disabled={!hasAllRequired}
                onClick={goNext}
                aria-label="Next step"
                icon={<MdArrowForward />}
                fontSize="3xl"
                boxSize="16"
              />
            )}
          </VStack>
        </MotionBox>
      </AnimatePresence>
    </Flex>
  )
}
