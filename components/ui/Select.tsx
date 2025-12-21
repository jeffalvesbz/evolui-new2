import React, { forwardRef } from 'react';
import { ChevronDownIcon } from '../icons';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    /** Label do select */
    label?: string;
    /** Mensagem de erro */
    error?: string;
    /** Texto de ajuda abaixo do select */
    helperText?: string;
    /** Container className */
    containerClassName?: string;
    /** Opções do select */
    options?: Array<{ value: string; label: string; disabled?: boolean }>;
    /** Placeholder */
    placeholder?: string;
}

/**
 * Componente Select padronizado com label, estados de erro e estilização consistente.
 * 
 * @example
 * // Select simples com options como children
 * <Select>
 *   <option value="1">Opção 1</option>
 *   <option value="2">Opção 2</option>
 * </Select>
 * 
 * // Select com prop options
 * <Select 
 *   label="Disciplina"
 *   options={[
 *     { value: 'mat', label: 'Matemática' },
 *     { value: 'port', label: 'Português' },
 *   ]}
 * />
 * 
 * // Select com erro
 * <Select label="Banca" error="Selecione uma opção" />
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            className = '',
            containerClassName = '',
            label,
            error,
            helperText,
            required,
            id,
            options,
            placeholder,
            children,
            ...props
        },
        ref
    ) => {
        const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
        const hasError = !!error;

        // Se não tem label nem features extras, retorna select simples
        if (!label && !error && !helperText) {
            return (
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={`
              w-full h-10 bg-input border rounded-lg px-3 py-2 pr-10 text-sm text-foreground
              appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
              disabled:cursor-not-allowed disabled:opacity-50
              ${hasError ? 'border-red-500' : 'border-border'}
              ${className}
            `.trim().replace(/\s+/g, ' ')}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options
                            ? options.map((opt) => (
                                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                    {opt.label}
                                </option>
                            ))
                            : children}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
            );
        }

        return (
            <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="text-sm font-medium text-muted-foreground"
                    >
                        {label}
                        {required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                )}

                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={`
              w-full h-10 bg-input border rounded-lg px-3 py-2 pr-10 text-sm text-foreground
              appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
              disabled:cursor-not-allowed disabled:opacity-50
              ${hasError ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-border'}
              ${className}
            `.trim().replace(/\s+/g, ' ')}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? `${selectId}-error` : undefined}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options
                            ? options.map((opt) => (
                                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                    {opt.label}
                                </option>
                            ))
                            : children}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                {error && (
                    <p id={`${selectId}-error`} className="text-xs text-red-500">
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

Select.displayName = 'Select';

export { Select };
export default Select;
