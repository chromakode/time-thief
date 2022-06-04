import { Flex, Textarea } from '@chakra-ui/react'
import { debounce } from 'lodash'
import { ContentComponentProps } from '../contentComponents'

export default function MultilineInput({
  entityDoc,
  field,
  save,
}: ContentComponentProps) {
  const storedValue = entityDoc[field]
  const handleChange = debounce(function (
    ev: React.ChangeEvent<HTMLTextAreaElement>,
  ) {
    save({ [field]: ev.target.value })
  },
  100)
  return (
    <Flex px="4" w="full" flex="1">
      <Textarea
        w="full"
        h="full"
        variant="filled"
        fontSize="xl"
        resize="none"
        defaultValue={storedValue}
        onChange={handleChange}
        sx={{ touchAction: 'pan-y' }}
      />
    </Flex>
  )
}
