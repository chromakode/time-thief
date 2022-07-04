import { Box, IconButton, VStack } from '@chakra-ui/react'
import { Ref, useCallback, useMemo, useRef, useState } from 'react'
import { MdArrowBack, MdArrowForward } from 'react-icons/md'
import contentComponents, {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'

export default function Steps(
  props: ContentComponentProps,
  ref: Ref<ContentComponentRef>,
) {
  const { spec, entityDoc, context } = props
  const [step, setStep] = useState(0)
  const componentRefs = useRef<ContentComponentRef[]>([])

  const leaveStep = useCallback(() => {
    for (const ref of componentRefs.current) {
      ref?.finalize?.()
    }
    componentRefs.current = []
  }, [])

  const nextStep = useCallback(() => {
    leaveStep()
    setStep((step) => step + 1)
  }, [leaveStep])

  const prevStep = useCallback(() => {
    leaveStep()
    setStep((step) => step - 1)
  }, [leaveStep])

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

  // TODO: animate
  return (
    <Box h="full" w="full" position="relative">
      {step > 0 && (
        <IconButton
          position="absolute"
          left="4"
          top="4"
          onClick={prevStep}
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
            onClick={nextStep}
            aria-label="Next step"
            icon={<MdArrowForward />}
            fontSize="3xl"
            boxSize="16"
          />
        )}
      </VStack>
    </Box>
  )
}
