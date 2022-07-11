import { sortedIndex } from 'lodash'

export default function weightedChoice<T>(
  items: T[],
  getWeight: (item: T) => number,
  randFloat: () => number,
): number {
  const weightArray = []
  let accumulator = 0

  for (const item of items) {
    weightArray.push(accumulator)
    accumulator += getWeight(item)
  }

  const value = randFloat() * accumulator
  const choiceIdx = sortedIndex(weightArray, value) - 1

  return choiceIdx
}
