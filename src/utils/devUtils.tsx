import { _db } from '..'
import { setClientId } from './getClientId'

declare global {
  interface Window {
    devUtils: any
  }
}

window.devUtils = {
  get db() {
    return _db
  },

  async allDocs() {
    return _db.allDocs({ include_docs: true })
  },

  async dumpDB() {
    return (await import('./dumpDB')).dumpDB()
  },

  setClientId,
}
