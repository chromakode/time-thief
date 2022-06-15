import { get, isArray, isPlainObject, isString, map, mapValues } from 'lodash'

const templateSubRe = /\$\{([\w.]+)\}/g

export default function deepTemplate(obj: any, values: any): any {
  if (isString(obj)) {
    return obj.replace(templateSubRe, (match, key) => get(values, key))
  } else if (isPlainObject(obj)) {
    return mapValues(obj, (v) => deepTemplate(v, values))
  } else if (isArray(obj)) {
    return map(obj, (v) => deepTemplate(v, values))
  } else {
    return obj
  }
}
