import type { DealInputs } from './types'
import { DEMO_DEAL } from './demo'

const KEY = 'deal-flow:v1:last'
const LIST_KEY = 'deal-flow:v1:saved'

export type SavedDeal = {
  id: string
  savedAt: string
  deal: DealInputs
}

export function loadLast(): DealInputs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(DEMO_DEAL)
    return { ...structuredClone(DEMO_DEAL), ...JSON.parse(raw) } as DealInputs
  } catch {
    return structuredClone(DEMO_DEAL)
  }
}

export function saveLast(deal: DealInputs): void {
  localStorage.setItem(KEY, JSON.stringify(deal))
}

export function listSaved(): SavedDeal[] {
  try {
    const raw = localStorage.getItem(LIST_KEY)
    return raw ? (JSON.parse(raw) as SavedDeal[]) : []
  } catch {
    return []
  }
}

export function saveNamed(deal: DealInputs, id?: string): SavedDeal {
  const items = listSaved()
  const entry: SavedDeal = {
    id: id ?? `d${Date.now().toString(36)}`,
    savedAt: new Date().toISOString(),
    deal: structuredClone(deal),
  }
  const i = items.findIndex((x) => x.id === entry.id)
  if (i >= 0) items[i] = entry
  else items.unshift(entry)
  localStorage.setItem(LIST_KEY, JSON.stringify(items))
  saveLast(deal)
  return entry
}

export function deleteSaved(id: string): void {
  localStorage.setItem(LIST_KEY, JSON.stringify(listSaved().filter((x) => x.id !== id)))
}

export function resetDemo(): DealInputs {
  const d = structuredClone(DEMO_DEAL)
  saveLast(d)
  return d
}
