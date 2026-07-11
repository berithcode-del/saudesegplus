import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PortalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[PortalErrorBoundary${this.props.routeName ? `:${this.props.routeName}` : ''}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const error = this.state.error;
      const isAuthError = error?.message?.includes('401') || error?.message?.includes('Sessão');
      const isNetworkError = error?.message?.includes('Failed to fetch') || error?.message?.includes('Network');

      return (
        <div style={{
          padding: 24,
          maxWidth: 480,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
          }}>
            {isNetworkError ? '📡' : isAuthError ? '🔒' : '⚠️'}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text-primary)', marginTop: 8 }}>
            {isNetworkError ? 'Sem conexão' : isAuthError ? 'Sessão expirada' : 'Algo deu errado'}
          </h2>

          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 320 }}>
            {isNetworkError
              ? 'Verifique sua conexão com a internet e tente novamente.'
              : isAuthError
                ? 'Sua sessão expirou. Faça login novamente.'
                : 'Ocorreu um erro inesperado. Tente novamente.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 280, marginTop: 8 }}>
            <button onClick={this.handleRetry} className="btn btn-primary" style={{ width: '100%' }}>
              Tentar novamente
            </button>
            <button onClick={this.handleGoHome} className="btn btn-secondary" style={{ width: '100%' }}>
              Voltar ao início
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <details style={{ marginTop: 16, width: '100%', textAlign: 'left' }}>
              <summary style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Detalhes do erro (dev)
              </summary>
              <pre style={{
                marginTop: 8,
                padding: 12,
                backgroundColor: 'var(--bg-input)',
                borderRadius: 8,
                fontSize: 11,
                overflow: 'auto',
                maxHeight: 150,
              }}>
                {error.message}\n{error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
