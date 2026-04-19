"use client"
import { Component, ReactNode } from "react"

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="border border-[#991B1B] p-4 m-4">
          <p className="font-pixel text-xs text-[#991B1B] uppercase tracking-widest mb-2">
            Fehler aufgetreten
          </p>
          <p className="text-sm font-sans text-textDim italic mb-4">
            "{this.state.error?.message || "Unbekannter Fehler"}"
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="border border-border px-4 py-2 text-xs uppercase tracking-widest font-sans hover:border-textMain transition-colors"
          >
            Neu laden
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
