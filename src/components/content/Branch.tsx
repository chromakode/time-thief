import { Ref, useCallback, useMemo } from 'react'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'
import { RenderSteps } from './Steps'

export default function Branch(
  { spec, ...props }: ContentComponentProps,
  ref: Ref<ContentComponentRef>,
) {
  const { entityDoc, set } = props
  const { branches, field } = spec

  const fieldValue = entityDoc[field]
  const hasValidBranch = branches.hasOwnProperty(fieldValue)

  const stepSpec = useMemo(() => {
    const steps = [branches.default]
    if (hasValidBranch) {
      steps.push(branches[fieldValue])
    }
    return { steps }
  }, [fieldValue, hasValidBranch, branches])

  // On back button press, unset field
  const handleStepChange = useCallback(
    (step: number) => {
      if (step === 0) {
        set({ [field]: undefined })
      }
    },
    [field, set],
  )

  return (
    <RenderSteps
      {...props}
      spec={stepSpec}
      step={hasValidBranch ? 1 : 0}
      onStepChange={handleStepChange}
    />
  )
}
