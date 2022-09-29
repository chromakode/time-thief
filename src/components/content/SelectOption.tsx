import {
  Icon,
  IconButton,
  StackDivider,
  useColorMode,
  VStack,
} from '@chakra-ui/react'
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
  const { colorMode } = useColorMode()
  const dividerColor = colorMode === 'dark' ? 'primary.600' : 'primary.200'

  const handleButtonClick = useCallback(
    (ev: React.MouseEvent) => {
      if (!(ev.currentTarget instanceof HTMLButtonElement)) {
        return
      }
      set({ [field]: ev.currentTarget.value })
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
      divider={<StackDivider borderColor={dividerColor} />}
    >
      {spec.options.map((option: any) => (
        <IconButton
          key={option.value}
          icon={<Icon as={icons[option.icon] ?? MdError} boxSize="16" />}
          aria-label={option.label}
          onClick={handleButtonClick}
          value={option.value}
          boxSize="28"
          mx="4"
        />
      ))}
    </VStack>
  )
}
