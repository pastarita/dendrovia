import { Component, type ReactNode } from 'react';

/**
 * ERROR BOUNDARY
 *
 * Catches rendering errors in the 3D Canvas subtree and displays
 * a Tron-themed fallback UI instead of a blank screen.
 *
 * Usage: Wraps the Canvas in App.tsx to catch WebGL context loss,
 * shader compilation failures, and other runtime errors.
 */

interface Props {
  children: ReactNode;
  /** Background color for the fallback UI */
  background?: string;
  /** Accent color for the fallback UI */
  accent?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ARCHITECTUS] Scene crashed:', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const bg = this.props.background ?? '#0a0a0a';
      const accent = this.props.accent ?? '#00ffff';

      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: bg,
            color: accent,
            fontFamily: "'Courier New', monospace",
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <div style={{ fontSize: '1.5rem', opacity: 0.9 }}>
            ARCHITECTUS
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.6, maxWidth: '400px', textAlign: 'center' }}>
            Rendering subsystem encountered an error
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              opacity: 0.4,
              maxWidth: '500px',
              textAlign: 'center',
              wordBreak: 'break-word',
            }}
          >
            {this.state.error?.message ?? 'Unknown error'}
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              background: 'transparent',
              border: `1px solid ${accent}`,
              color: accent,
              padding: '0.5rem 1.5rem',
              fontFamily: "'Courier New', monospace",
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginTop: '0.5rem',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
