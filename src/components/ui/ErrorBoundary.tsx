'use client'

import { Component, type ReactNode } from 'react'
import { useUIStore } from '@/store/uiStore'
import { t } from '@/lib/i18n'
import { captureError } from '@/lib/sentry'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    captureError(error, { component: 'ErrorBoundary' })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      const lang = useUIStore.getState().lang

      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-white dark:bg-slate-900 text-center">
          <div className="text-3xl mb-3">⚠</div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
            {t('error.title', lang)}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
            {t('error.desc', lang)}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {t('error.reload', lang)}
          </button>
          {this.state.error && (
            <details className="mt-4 text-left max-w-sm">
              <summary className="text-[10px] text-gray-400 cursor-pointer">
                {t('error.details', lang)}
              </summary>
              <pre className="mt-1 text-[10px] text-red-500 dark:text-red-400 whitespace-pre-wrap break-all">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
