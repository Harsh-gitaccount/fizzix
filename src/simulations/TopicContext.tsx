'use client'

import { createContext, useContext } from 'react'
import type { SimulationModule } from './types'

const TopicContext = createContext<SimulationModule | null>(null)

export function TopicProvider({
  module,
  children,
}: {
  module: SimulationModule
  children: React.ReactNode
}) {
  return <TopicContext.Provider value={module}>{children}</TopicContext.Provider>
}

export function useTopic(): SimulationModule {
  const ctx = useContext(TopicContext)
  if (!ctx) throw new Error('useTopic must be used within a TopicProvider')
  return ctx
}
