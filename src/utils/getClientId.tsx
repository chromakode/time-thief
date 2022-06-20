// Use a unique identifier for which client authored entities.
// Useful for removing data created during testing & development.

const KEY = 'clientId'

export function setClientId(id?: string) {
  localStorage[KEY] = id ?? Math.random().toString(16).substring(2)
}

export function getClientId() {
  if (!localStorage[KEY]) {
    setClientId()
  }
  return localStorage[KEY]
}
