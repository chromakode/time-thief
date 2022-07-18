import { Button, Icon, StackDivider, VStack } from '@chakra-ui/react'
import React, { Ref, useCallback } from 'react'
import { IconType } from 'react-icons'
import {
  MdEditNote,
  MdError,
  MdPhotoCamera,
  MdThumbDown,
  MdThumbUp,
} from 'react-icons/md'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'

const icons: Record<string, IconType> = {
  MdEditNote,
  MdPhotoCamera,
  MdThumbUp,
  MdThumbDown,
  MdError,
}

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
          boxSize="28"
          mx="4"
          _light={{
            color: 'primary.50',
          }}
          _dark={{
            color: 'primary.800',
          }}
        >
          {option.icon ? (
            <Icon as={icons[option.icon] ?? MdError} boxSize="16" />
          ) : (
            option.label
          )}
        </Button>
      ))}
    </VStack>
  )
}
