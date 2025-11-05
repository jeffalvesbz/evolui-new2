/**
 * Sistema de logging estruturado
 * 
 * Remove logs em produção automaticamente (via Vite config)
 * Em desenvolvimento, exibe logs no console
 * Em produção, pode enviar para serviços de logging (Sentry, LogRocket, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private isProd = import.meta.env.PROD;

  /**
   * Log genérico
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level,
      message,
      timestamp,
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    // Em desenvolvimento, exibir no console
    if (this.isDev) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '🚨',
      }[level];

      console[consoleMethod](`${emoji} [${level.toUpperCase()}] ${message}`, logEntry);
    }

    // Em produção, enviar apenas erros para serviço de logging
    if (this.isProd && level === 'error') {
      // TODO: Integrar com serviço de logging
      // Exemplos:
      // - Sentry.captureException(error, { extra: context });
      // - LogRocket.captureException(error, { extra: context });
      // - Analytics.track('error', { message, ...context });
    }
  }

  /**
   * Debug - informações detalhadas para desenvolvimento
   */
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  /**
   * Info - informações gerais
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  /**
   * Warn - avisos que não impedem execução
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  /**
   * Error - erros que precisam atenção
   */
  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error);
  }

  /**
   * Helper para logar ações do usuário
   */
  userAction(action: string, context?: LogContext) {
    this.info(`User action: ${action}`, { ...context, action, type: 'user_action' });
  }

  /**
   * Helper para logar erros de API
   */
  apiError(endpoint: string, error: Error, context?: LogContext) {
    this.error(`API Error: ${endpoint}`, error, {
      ...context,
      endpoint,
      type: 'api_error',
    });
  }

  /**
   * Helper para logar performance
   */
  performance(metric: string, duration: number, context?: LogContext) {
    this.debug(`Performance: ${metric}`, {
      ...context,
      metric,
      duration,
      type: 'performance',
    });
  }
}

export const logger = new Logger();

