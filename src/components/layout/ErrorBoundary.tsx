'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Cadence] Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="max-w-sm w-full text-center space-y-6">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-error) 12%, transparent)' }}
            >
              <AlertTriangle size={28} style={{ color: 'var(--color-error)' }} />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                Oups, quelque chose a plante
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Pas de panique, tes donnees sont en securite. Essaie de recharger la page.
              </p>
            </div>

            {this.state.error && (
              <div
                className="text-left p-3 rounded-xl text-xs font-mono break-all max-h-24 overflow-y-auto"
                style={{
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text-dim)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                }}
              >
                <RefreshCw size={14} />
                Reessayer
              </button>
              <button
                onClick={this.handleHome}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Home size={14} />
                Accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
