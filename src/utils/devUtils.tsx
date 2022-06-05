import { _db } from '..'

declare global {
  interface Window {
    devUtils: any
  }
}

window.devUtils = {
  async allDocs() {
    return _db.allDocs({ include_docs: true })
  },

  async clearConfig() {
    const configDoc = await _db.get('config')
    await _db.remove(configDoc)
  },
}
