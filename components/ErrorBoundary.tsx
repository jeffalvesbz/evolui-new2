import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon } from './icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error para console em desenvolvimento
    if (import.meta.env.DEV) {
      try {
        console.error('🚨 Error Boundary capturou um erro:', error?.message || String(error));
        console.error('Error Info:', errorInfo?.componentStack || 'N/A');
      } catch (e) {
        // Silenciosamente falha se não conseguir logar
      }
    }

    // Chamar callback personalizado se fornecido
    this.props.onError?.(error, errorInfo);

    // Em produção, enviar para serviço de logging (Sentry, LogRocket, etc.)
    if (import.meta.env.PROD) {
      // TODO: Integrar com serviço de logging
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }

    // Salvar estado do erro
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <div className="max-w-md w-full bg-[#0a0f1e] border-2 border-[#1e293b] p-8 rounded-2xl text-center space-y-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
            <div className="flex justify-center">
              <AlertTriangleIcon className="w-16 h-16 text-red-500" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Ops! Algo deu errado
              </h2>
              <p className="text-muted-foreground">
                Encontramos um erro inesperado. Não se preocupe, seus dados estão seguros.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left">
                <p className="text-sm font-mono text-red-400 mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer mb-2">Stack trace</summary>
                    <pre className="overflow-auto max-h-40 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Tentar novamente
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                Recarregar página
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Se o problema persistir, entre em contato com o suporte: suporte@meueleva.com
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

