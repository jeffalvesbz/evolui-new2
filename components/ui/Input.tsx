import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label do input */
  label?: string;
  /** Mensagem de erro */
  error?: string;
  /** Ícone à esquerda */
  leftIcon?: React.ReactNode;
  /** Ícone à direita */
  rightIcon?: React.ReactNode;
  /** Texto de ajuda abaixo do input */
  helperText?: string;
  /** Container className */
  containerClassName?: string;
}

/**
 * Componente Input padronizado com label, ícones e estados de erro.
 * 
 * @example
 * // Input simples
 * <Input placeholder="Digite seu nome" />
 * 
 * // Input com label
 * <Input label="Email" type="email" />
 * 
 * // Input com erro
 * <Input label="Senha" type="password" error="Senha muito curta" />
 * 
 * // Input com ícone
 * <Input leftIcon={<SearchIcon />} placeholder="Buscar..." />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      containerClassName = '',
      label,
      error,
      leftIcon,
      rightIcon,
      helperText,
      required,
      id,
      type,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasError = !!error;

    // Se não tem label nem nenhuma feature extra, retorna só o input
    if (!label && !error && !leftIcon && !rightIcon && !helperText) {
      return (
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`
            flex h-10 w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground
            ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
            placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${hasError ? 'border-red-500' : 'border-border'}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
      );
    }

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-muted-foreground"
          >
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`
              w-full h-10 bg-input border rounded-lg px-3 py-2 text-sm text-foreground
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
              disabled:cursor-not-allowed disabled:opacity-50
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${hasError ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-border'}
              ${className}
            `.trim().replace(/\s+/g, ' ')}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-500">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;