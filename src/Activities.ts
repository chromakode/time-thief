import dayjs, { ManipulateType } from 'dayjs'
import { isArray, isPlainObject, map, mapValues } from 'lodash'
import seedrandom from 'seedrandom'
import weightedChoice from './utils/weightedChoice'

export type ActivityData = any // TODO
export type ConfigData = any // TODO
export type ActivityDefinition = any
export type Choices = Array<any>

const SEED_DURATION = 15 * 60 * 1000

const rarityToWeight = new Map([
  ['xx-common', 4],
  ['x-common', 2],
  ['common', 1],
  ['uncommon', 0.5],
  ['rare', 0.25],
  ['x-rare', 0.125],
])

function hoursToTimeOfDay(
  hour: number,
  timeNames: Record<string, string>,
): string {
  let name
  for (let [startHourStr, nextName] of Object.entries(timeNames)) {
    if (hour < Number(startHourStr)) {
      break
    }
    name = nextName
  }
  return name ?? 'unknown'
}

function seedFromTimestamp(ts: number) {
  return Math.floor(ts / SEED_DURATION).toString()
}

class Activities {
  data: ActivityData

  constructor(activityData: ActivityData) {
    this.data = activityData
  }

  getSeed() {
    const now = Date.now()

    // TODO: merge in random source from persistence? give a full 15 min when a fresh set is generated
    // Roll seed every 15 min
    const seed = seedFromTimestamp(now)
    const endTime = SEED_DURATION * Math.ceil(now / SEED_DURATION)

    return { seed, now, endTime }
  }

  chooseActivities({
    lastActivityTimes,
  }: {
    lastActivityTimes: Record<string, number>
  }) {
    const { seed, now, endTime } = this.getSeed()

    const nowHours = new Date(now).getHours()
    const timeOfDay = hoursToTimeOfDay(nowHours, this.data.config.timeNames)

    const traversal = new Traversal(
      seed,
      now,
      timeOfDay,
      this.data.config,
      lastActivityTimes,
    )

    const manualActivity = traversal.flattenChoices(this.data.manualActivity)
    const activities = traversal.run(this.data.activities)

    return { activities, manualActivity, seed, now, endTime, timeOfDay }
  }
}

// FIXME: this class and chooseActivities should be merged/cleaned up
class Traversal {
  rng: ReturnType<seedrandom>
  seed: string
  now: number
  timeOfDay: string
  config: ConfigData
  lastActivityTimes: Record<string, number>

  constructor(
    seed: string,
    now: number,
    timeOfDay: string,
    config: ConfigData,
    lastActivityTimes: Record<string, number>,
  ) {
    this.rng = seedrandom(seed)
    this.seed = seed
    this.now = now
    this.timeOfDay = timeOfDay
    this.config = config
    this.lastActivityTimes = lastActivityTimes
  }

  run(activities: [ActivityDefinition], count = 3): ActivityData[] {
    const selected = this._choice(activities, count)
    return map(selected, (act) => this.flattenChoices(act))
  }

  _getWeight(activity: any) {
    return rarityToWeight.get(activity.rarity ?? 'uncommon') ?? 1
  }

  _choice(choices: Choices, count: number = 1) {
    const results: any = []
    const seenTags = new Set<string>()

    let choicesCopy = this._filterChoices(choices, seenTags)
    for (let i = 0; i < count; i++) {
      const idx = weightedChoice(choicesCopy, this._getWeight, this.rng)
      const chosen = choicesCopy[idx]
      results.push(chosen)

      for (const tag of chosen.conditions?.exclusiveTags ?? []) {
        seenTags.add(tag)
      }
      choicesCopy.splice(idx, 1)
      choicesCopy = this._filterChoices(choicesCopy, seenTags)
    }

    return results
  }

  _filterChoices(choices: Choices, seenTags: Set<string>) {
    return choices.filter((c) => {
      if (!c.hasOwnProperty('conditions')) {
        return true
      }

      for (const [condType, condValue] of Object.entries(c['conditions'])) {
        if (condType === 'timeOfDay') {
          if (
            condValue instanceof Array &&
            !condValue.includes(this.timeOfDay)
          ) {
            return false
          }
        } else if (condType === 'frequency') {
          const lastActivityTime = this.lastActivityTimes[c.id]
          let count: number
          let unit: ManipulateType
          if (isArray(condValue)) {
            count = condValue[0]
            unit = condValue[1]
          } else {
            count = 1
            unit = condValue as ManipulateType
          }
          if (
            lastActivityTime &&
            seedFromTimestamp(lastActivityTime) !== this.seed &&
            dayjs(this.now)
              .subtract(count, unit)
              .isBefore(lastActivityTime, unit)
          ) {
            return false
          }
        } else if (condType === 'exclusiveTags') {
          for (const tag of condValue as string[]) {
            if (seenTags.has(tag)) {
              return false
            }
          }
        } else {
          throw new Error(`Unexpected condition type ${condType}`)
        }
      }

      return true
    })
  }

  flattenChoices(obj: any): any {
    if (obj.type === 'choice') {
      const choice = this._choice(obj.choices)[0]
      return this.flattenChoices(choice)
    } else if (isPlainObject(obj)) {
      return mapValues(obj, (v) => this.flattenChoices(v))
    } else if (isArray(obj)) {
      return map(obj, (v) => this.flattenChoices(v))
    } else {
      return obj
    }
  }
}

export default Activities
