import { Button, StackDivider, VStack } from '@chakra-ui/react'
import React, { Ref, useCallback } from 'react'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'

export default function SelectOption(
  { entityDoc, field, spec, set }: ContentComponentProps,
  ref: Ref<ContentComponentRef>,
) {
  const handleButtonClick = useCallback(
    (ev: React.MouseEvent) => {
      if (!(ev.target instanceof HTMLButtonElement)) {
        return
      }
      set({ [field]: ev.target.value })
    },
    [field, set],
  )

  return (
    <VStack
      px="4"
      flex="1"
      alignItems="center"
      justifyContent="center"
      spacing="8"
      divider={
        <StackDivider
          _light={{
            borderColor: 'primary.200',
          }}
          _dark={{
            borderColor: 'primary.600',
          }}
        />
      }
    >
      {spec.options.map((option: any) => (
        <Button
          key={option.value}
          onClick={handleButtonClick}
          value={option.value}
          fontSize="7xl"
          boxSize="32"
          mx="4"
          _light={{
            bgColor: 'primary.100',
          }}
          _dark={{
            bgColor: 'primary.700',
          }}
        >
          {option.label}
        </Button>
      ))}
    </VStack>
  )
}
