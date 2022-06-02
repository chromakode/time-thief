import { isPlainObject, isArray, map, mapValues } from 'lodash'
import seedrandom from 'seedrandom'

export type ActivityData = any // TODO
export type ConfigData = any // TODO
export type ActivityDefinition = any
export type Choices = Array<any> // add weighting'

const SEED_DURATION = 15 * 60 * 1000

function hoursToTimeOfDay(
  hour: number,
  timeNames: Record<string, string>,
): string {
  let startHourStr, name
  for ([startHourStr, name] of Object.entries(timeNames)) {
    if (hour < Number(startHourStr)) {
      return name
    }
  }
  return name ?? 'unknown'
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
    const seed = Math.floor(now / SEED_DURATION).toString()
    const endTime = SEED_DURATION * Math.ceil(now / SEED_DURATION)

    return { seed, now, endTime }
  }

  chooseActivities(count: number = 3) {
    const { seed, now, endTime } = this.getSeed()

    const nowHours = new Date(now).getHours()
    const timeOfDay = hoursToTimeOfDay(nowHours, this.data.config.timeNames)

    const traversal = new Traversal(seed, timeOfDay, this.data.config)
    const activities = traversal.run(this.data.activities)

    return { activities, seed, now, endTime, timeOfDay }
  }
}

class Traversal {
  rng: ReturnType<seedrandom>
  timeOfDay: string
  config: ConfigData

  constructor(seed: string, timeOfDay: string, config: ConfigData) {
    this.rng = seedrandom(seed)
    this.timeOfDay = timeOfDay
    this.config = config
  }

  run(activities: [ActivityDefinition]): ActivityData[] {
    const selected = this._choice(activities, 3)
    return map(selected, (act) => this._flattenChoices(act))
  }

  _choice(choices: Choices, count: number = 1) {
    const results: any = []

    const choicesCopy = this._filterChoices(choices)
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(this.rng() * choicesCopy.length)
      results.push(choicesCopy[idx])
      choicesCopy.splice(idx, 1)
    }

    return results
  }

  _filterChoices(choices: Choices) {
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
        } else {
          throw new Error(`Unexpected condition type ${condType}`)
        }
      }

      return true
    })
  }

  _flattenChoices(obj: any): any {
    if (obj.type === 'choice') {
      const choice = this._choice(obj.choices)[0]
      return this._flattenChoices(choice)
    } else if (isPlainObject(obj)) {
      return mapValues(obj, (v) => this._flattenChoices(v))
    } else if (isArray(obj)) {
      return map(obj, (v) => this._flattenChoices(v))
    } else {
      return obj
    }
  }
}

export default Activities
