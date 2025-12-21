import React, { forwardRef, useEffect, useRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Label do textarea */
    label?: string;
    /** Mensagem de erro */
    error?: string;
    /** Texto de ajuda abaixo do textarea */
    helperText?: string;
    /** Se deve auto-redimensionar com o conteúdo */
    autoResize?: boolean;
    /** Container className */
    containerClassName?: string;
}

/**
 * Componente Textarea padronizado com label, estados de erro e auto-resize.
 * 
 * @example
 * // Textarea simples
 * <Textarea placeholder="Digite sua mensagem" />
 * 
 * // Textarea com label
 * <Textarea label="Observações" rows={4} />
 * 
 * // Textarea com auto-resize
 * <Textarea label="Descrição" autoResize />
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            className = '',
            containerClassName = '',
            label,
            error,
            helperText,
            autoResize = false,
            required,
            id,
            rows = 3,
            onChange,
            ...props
        },
        ref
    ) => {
        const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
        const hasError = !!error;
        const internalRef = useRef<HTMLTextAreaElement>(null);

        // Merge refs
        const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

        // Auto-resize handler
        const handleAutoResize = (element: HTMLTextAreaElement) => {
            if (autoResize) {
                element.style.height = 'auto';
                element.style.height = `${element.scrollHeight}px`;
            }
        };

        useEffect(() => {
            if (autoResize && textareaRef.current) {
                handleAutoResize(textareaRef.current);
            }
        }, [autoResize, props.value]);

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (autoResize) {
                handleAutoResize(e.target);
            }
            onChange?.(e);
        };

        // Se não tem label nem nenhuma feature extra, retorna só o textarea
        if (!label && !error && !helperText) {
            return (
                <textarea
                    ref={textareaRef}
                    id={textareaId}
                    rows={rows}
                    onChange={handleChange}
                    className={`
            w-full bg-input border rounded-lg px-3 py-2 text-sm text-foreground
            placeholder:text-muted-foreground resize-y
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            disabled:cursor-not-allowed disabled:opacity-50
            ${autoResize ? 'resize-none overflow-hidden' : ''}
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
                        htmlFor={textareaId}
                        className="text-sm font-medium text-muted-foreground"
                    >
                        {label}
                        {required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                )}

                <textarea
                    ref={textareaRef}
                    id={textareaId}
                    rows={rows}
                    onChange={handleChange}
                    className={`
            w-full bg-input border rounded-lg px-3 py-2 text-sm text-foreground
            placeholder:text-muted-foreground resize-y
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            disabled:cursor-not-allowed disabled:opacity-50
            ${autoResize ? 'resize-none overflow-hidden' : ''}
            ${hasError ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-border'}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `${textareaId}-error` : undefined}
                    {...props}
                />

                {error && (
                    <p id={`${textareaId}-error`} className="text-xs text-red-500">
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

Textarea.displayName = 'Textarea';

export { Textarea };
export default Textarea;
