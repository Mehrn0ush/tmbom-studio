import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Optional label for which UI region failed (e.g. "workspace"). */
  label?: string
  onReset?: () => void
}

type State = {
  error: Error | null
}

/**
 * Catches render errors so a single broken view does not blank the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', this.props.label ?? 'app', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const where = this.props.label ? ` in ${this.props.label}` : ''

    return (
      <div className="panel panel-pad error-boundary" role="alert">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>
          Something went wrong{where}
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          The UI hit an unexpected error. Your in-browser draft may still be in
          local storage — try again, open Projects to save, or reload.
        </p>
        <p className="mono" style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
          {error.message || String(error)}
        </p>
        <div className="btn-row">
          <button className="btn btn-primary" type="button" onClick={this.reset}>
            Try again
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    )
  }
}
