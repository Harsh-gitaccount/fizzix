'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { getModule } from '@/simulations/registry'
import { TopicProvider } from '@/simulations/TopicContext'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import BrowserCheck from '@/components/ui/BrowserCheck'
import Link from 'next/link'

const SimulationPage = dynamic(
  () => import('@/components/simulation/SimulationPage'),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="text-4xl mb-3">{'⚛'}</div>
          <div className="text-sm font-bold text-gray-600 dark:text-gray-400">Loading Fizzix...</div>
        </div>
      </div>
    ),
  }
)

export default function TopicPage() {
  const { topic } = useParams<{ topic: string }>()
  const mod = getModule(topic)

  if (!mod) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Topic not found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            &ldquo;{topic}&rdquo; is not available yet.
          </p>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <BrowserCheck>
        <TopicProvider module={mod}>
          <SimulationPage />
        </TopicProvider>
      </BrowserCheck>
    </ErrorBoundary>
  )
}
