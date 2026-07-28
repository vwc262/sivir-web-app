// Storage adapter — web usa localStorage (síncrono).
export interface KeyValueStorage {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}

let active: KeyValueStorage = window.localStorage

export function setSivirStorage(storage: KeyValueStorage): void {
  active = storage
}

export const sivirStorage: KeyValueStorage = {
  getItem: (name) => active.getItem(name),
  setItem: (name, value) => active.setItem(name, value),
  removeItem: (name) => active.removeItem(name),
}
