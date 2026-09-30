import { QUIZ_POOL_VERSION } from '@/data/quiz/poolVersion'

const DB_NAME = 'fizzix-quiz'
const DB_VERSION = 1
const STORE_NAME = 'results'

export interface QuizResultRecord {
  id: string
  sessionId: string
  topicId: string
  questionId: string
  selectedIndex: number
  correct: boolean
  difficulty: string
  poolVersion: number
  timestamp: number
  synced: number // 0 = unsynced, 1 = synced (IDB indexes need non-boolean)
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem('fizzix-session-id')
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem('fizzix-session-id', id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('synced', 'synced')
        store.createIndex('sessionId', 'sessionId')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveQuizResult(
  topicId: string,
  questionId: string,
  selectedIndex: number,
  correct: boolean,
  difficulty: string
): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const record: QuizResultRecord = {
      id: crypto.randomUUID(),
      sessionId: getSessionId(),
      topicId,
      questionId,
      selectedIndex,
      correct,
      difficulty,
      poolVersion: QUIZ_POOL_VERSION,
      timestamp: Date.now(),
      synced: 0,
    }

    store.add(record)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // IndexedDB unavailable (private browsing, etc.)
  }
}

export async function getUnsyncedResults(): Promise<QuizResultRecord[]> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('synced')
    const request = index.getAll(0)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? [])
      request.onerror = () => reject(request.error)
    })
  } catch {
    return []
  }
}

export async function markResultsSynced(ids: string[]): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    for (const id of ids) {
      const getReq = store.get(id)
      getReq.onsuccess = () => {
        const record = getReq.result
        if (record) {
          record.synced = 1
          store.put(record)
        }
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Silently fail
  }
}

let retryDelay = 0

export async function syncQuizResults(): Promise<void> {
  if (!navigator.onLine) return

  try {
    const unsynced = await getUnsyncedResults()
    if (unsynced.length === 0) return

    const payload = unsynced.map((r) => ({
      sessionId: r.sessionId,
      topicId: r.topicId,
      questionId: r.questionId,
      selected: r.selectedIndex,
      correct: r.correct,
      difficulty: r.difficulty,
      poolVersion: r.poolVersion ?? 1,
      timestamp: r.timestamp,
    }))

    const response = await fetch('/api/quiz/results/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: payload }),
    })

    if (response.ok) {
      retryDelay = 0
      await markResultsSynced(unsynced.map((r) => r.id))
    } else if (response.status === 429 || response.status === 503) {
      const wait = retryDelay === 0 ? 5_000 : Math.min(retryDelay * 2, 60_000)
      retryDelay = wait
      setTimeout(() => { syncQuizResults() }, wait)
    }
  } catch {
    const wait = retryDelay === 0 ? 5_000 : Math.min(retryDelay * 2, 60_000)
    retryDelay = wait
    setTimeout(() => { syncQuizResults() }, wait)
  }
}

export function setupSyncListeners(): () => void {
  const handler = () => {
    retryDelay = 0
    syncQuizResults()
  }
  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}
