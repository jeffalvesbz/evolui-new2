import React, { forwardRef } from 'react';

// Variantes de estilo do botão
const buttonVariants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    ghost: 'hover:bg-muted text-foreground',
    outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
};

// Tamanhos do botão
const buttonSizes = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
    md: 'h-10 px-4 text-sm gap-2 rounded-lg',
    lg: 'h-12 px-6 text-base gap-2 rounded-lg',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Variante visual do botão */
    variant?: keyof typeof buttonVariants;
    /** Tamanho do botão */
    size?: keyof typeof buttonSizes;
    /** Mostra um spinner de loading */
    loading?: boolean;
    /** Ícone à esquerda do texto */
    leftIcon?: React.ReactNode;
    /** Ícone à direita do texto */
    rightIcon?: React.ReactNode;
    /** Se o botão deve ocupar toda a largura */
    fullWidth?: boolean;
}

/**
 * Componente Button padronizado com variantes, tamanhos e estados.
 * 
 * @example
 * // Botão primário padrão
 * <Button>Salvar</Button>
 * 
 * // Botão com loading
 * <Button loading>Salvando...</Button>
 * 
 * // Botão com ícone
 * <Button leftIcon={<PlusIcon />}>Adicionar</Button>
 * 
 * // Botão de perigo
 * <Button variant="danger">Excluir</Button>
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className = '',
            variant = 'primary',
            size = 'md',
            loading = false,
            disabled,
            leftIcon,
            rightIcon,
            fullWidth = false,
            children,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                className={`
          inline-flex items-center justify-center font-medium transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          disabled:pointer-events-none disabled:opacity-50
          ${buttonVariants[variant]}
          ${buttonSizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
                disabled={isDisabled}
                {...props}
            >
                {loading ? (
                    <>
                        <LoadingSpinner className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
                        {children}
                    </>
                ) : (
                    <>
                        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                        {children}
                        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

// Spinner de loading interno
const LoadingSpinner: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg
        className={`animate-spin ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);

export { Button };
export default Button;
