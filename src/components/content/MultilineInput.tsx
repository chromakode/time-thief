import { Flex, Textarea } from '@chakra-ui/react'
import { debounce } from 'lodash'
import { Ref } from 'react'
import {
  ContentComponentProps,
  ContentComponentRef,
} from '../contentComponents'

export default function MultilineInput(
  { entityDoc, field, set }: ContentComponentProps,
  ref: Ref<ContentComponentRef>,
) {
  const storedValue = entityDoc[field]
  const handleChange = debounce(
    (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
      set({ [field]: ev.target.value })
    },
    100,
  )
  return (
    <Flex px="4" w="full" flex="1">
      <Textarea
        w="full"
        h="full"
        variant="filled"
        fontSize="xl"
        textStyle="input"
        resize="none"
        defaultValue={storedValue}
        onChange={handleChange}
        sx={{ touchAction: 'pan-y' }}
      />
    </Flex>
  )
}
