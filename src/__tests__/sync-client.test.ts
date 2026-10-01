import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/data/quiz/poolVersion', () => ({ QUIZ_POOL_VERSION: 1 }))

const records: Map<string, { id: string; synced: number; [k: string]: unknown }> = new Map()

function makeRecord(id: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    sessionId: 'test-session',
    topicId: 'projectile-motion',
    questionId: 'pm-e-1',
    selectedIndex: 0,
    correct: true,
    difficulty: 'easy',
    poolVersion: 1,
    timestamp: Date.now(),
    synced: 0,
    ...overrides,
  }
}

function makeMockStore() {
  return {
    add(record: Record<string, unknown>) {
      records.set(record.id as string, { ...record } as { id: string; synced: number })
    },
    get(id: string) {
      const req = { result: undefined as unknown, onsuccess: null as null | (() => void) }
      Promise.resolve().then(() => {
        req.result = records.get(id) ? { ...records.get(id) } : undefined
        req.onsuccess?.()
      })
      return req
    },
    put(record: Record<string, unknown>) {
      records.set(record.id as string, { ...record } as { id: string; synced: number })
    },
    index(_name: string) {
      return {
        getAll(value: number) {
          const matches = Array.from(records.values()).filter((r) => r.synced === value)
          const req = { result: undefined as unknown, onsuccess: null as null | (() => void), onerror: null as null | (() => void) }
          Promise.resolve().then(() => {
            req.result = matches
            req.onsuccess?.()
          })
          return req
        },
      }
    },
  }
}

function makeMockDB() {
  const store = makeMockStore()
  return {
    objectStoreNames: { contains: () => true },
    transaction(_name: string, _mode?: string) {
      const tx = {
        objectStore() { return store },
        oncomplete: null as null | (() => void),
        onerror: null as null | (() => void),
      }
      Promise.resolve().then(() => Promise.resolve()).then(() => {
        tx.oncomplete?.()
      })
      return tx
    },
    close() {},
  }
}

function installMockIDB() {
  const mockDB = makeMockDB()
  const idb = {
    open() {
      const req = {
        result: mockDB,
        onsuccess: null as null | (() => void),
        onerror: null as null | (() => void),
        onupgradeneeded: null as null | (() => void),
      }
      Promise.resolve().then(() => req.onsuccess?.())
      return req
    },
  }
  Object.defineProperty(globalThis, 'indexedDB', { value: idb, writable: true, configurable: true })
}

describe('syncQuizResults - actual function with controlled fetch and IDB', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    vi.resetModules()
    records.clear()
    originalFetch = globalThis.fetch
    mockFetch = vi.fn()
    globalThis.fetch = mockFetch
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
    installMockIDB()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  async function callSync() {
    const mod = await import('@/lib/quiz/offlineStorage')
    await mod.syncQuizResults()
  }

  it('marks only acknowledged IDs as synced when server returns partial acceptedIds', async () => {
    records.set('rec-1', makeRecord('rec-1'))
    records.set('rec-2', makeRecord('rec-2'))

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ synced: 1, stored: true, acceptedIds: ['rec-1'] }),
    })

    await callSync()

    expect(records.get('rec-1')?.synced).toBe(1)
    expect(records.get('rec-2')?.synced).toBe(0)
  })

  it('does not mark any records when stored is false', async () => {
    records.set('rec-1', makeRecord('rec-1'))

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ synced: 0, stored: false, message: 'No database configured' }),
    })

    await callSync()

    expect(records.get('rec-1')?.synced).toBe(0)
  })

  it('does not mark records when stored field is missing', async () => {
    records.set('rec-1', makeRecord('rec-1'))

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ synced: 1, acceptedIds: ['rec-1'] }),
    })

    await callSync()

    expect(records.get('rec-1')?.synced).toBe(0)
  })

  it('does not mark records when acceptedIds is empty', async () => {
    records.set('rec-1', makeRecord('rec-1'))

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ synced: 1, stored: true, acceptedIds: [] }),
    })

    await callSync()

    expect(records.get('rec-1')?.synced).toBe(0)
  })

  it('filters out unrelated IDs from server response', async () => {
    records.set('rec-1', makeRecord('rec-1'))
    records.set('rec-2', makeRecord('rec-2'))

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ synced: 2, stored: true, acceptedIds: ['rec-1', 'rec-unrelated'] }),
    })

    await callSync()

    expect(records.get('rec-1')?.synced).toBe(1)
    expect(records.get('rec-2')?.synced).toBe(0)
  })

  it('does not mark records when positive count but no acceptedIds field', async () => {
    records.set('rec-1', makeRecord('rec-1'))

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ synced: 1, stored: true }),
    })

    await callSync()

    expect(records.get('rec-1')?.synced).toBe(0)
  })

  it('does nothing when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
    records.set('rec-1', makeRecord('rec-1'))

    await callSync()

    expect(mockFetch).not.toHaveBeenCalled()
    expect(records.get('rec-1')?.synced).toBe(0)
  })

  it('does nothing when no unsynced results exist', async () => {
    await callSync()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('sends correct payload shape to fetch', async () => {
    records.set('rec-1', makeRecord('rec-1', { selectedIndex: 2, correct: false, difficulty: 'hard' }))

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ synced: 1, stored: true, acceptedIds: ['rec-1'] }),
    })

    await callSync()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/quiz/results/batch')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.results).toHaveLength(1)
    expect(body.results[0]).toMatchObject({
      id: 'rec-1',
      topicId: 'projectile-motion',
      selected: 2,
      correct: false,
      difficulty: 'hard',
      poolVersion: 1,
    })
  })

  it('marks all submitted IDs when server acknowledges all', async () => {
    records.set('rec-1', makeRecord('rec-1'))
    records.set('rec-2', makeRecord('rec-2'))
    records.set('rec-3', makeRecord('rec-3'))

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ synced: 3, stored: true, acceptedIds: ['rec-1', 'rec-2', 'rec-3'] }),
    })

    await callSync()

    expect(records.get('rec-1')?.synced).toBe(1)
    expect(records.get('rec-2')?.synced).toBe(1)
    expect(records.get('rec-3')?.synced).toBe(1)
  })
})
