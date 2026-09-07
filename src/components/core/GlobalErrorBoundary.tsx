'use client'

import Link from 'next/link'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Tap } from '@/components/ui/Tap'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface GlobalErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  enableRecovery?: boolean
  showErrorDetails?: boolean
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  retry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, { componentStack: '' }, this.retry)
      }
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--paper)] text-[var(--ink)]">
          <div className="max-w-md w-full">
            <p className="font-display text-4xl">CHIME</p>
            <h1 className="mt-6 text-[15px]">Something broke on the floor.</h1>
            <p className="mt-2 text-[13px] text-[var(--mute)]">
              Retry, or go back to the live window.
            </p>
            {this.props.showErrorDetails && (
              <p className="mt-4 text-[12px] text-[var(--halt)] break-all">{this.state.error.message}</p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Tap tone="brass" onClick={this.retry}>
                Try again
              </Tap>
              <Link
                href="/"
                className="h-11 px-5 text-[13px] font-medium border border-[var(--line)] text-[var(--ink)] inline-flex items-center"
              >
                Floor
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
