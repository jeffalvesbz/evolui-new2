import React from 'react';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
    /** Variante visual */
    variant?: 'default' | 'outline' | 'ghost';
    /** Tamanho */
    size?: 'sm' | 'md';
}

/**
 * Componente Kbd para exibir atalhos de teclado.
 * 
 * @example
 * // Básico
 * <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd>
 * 
 * // Com props
 * <Kbd size="sm">⌘</Kbd>
 * 
 * // Em tooltip
 * <SimpleTooltip content={<>Salvar <Kbd size="sm">Ctrl+S</Kbd></>}>
 *   <Button>Salvar</Button>
 * </SimpleTooltip>
 */
const Kbd: React.FC<KbdProps> = ({
    children,
    variant = 'default',
    size = 'md',
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-mono font-medium rounded';

    const variantClasses = {
        default: 'bg-muted border border-border shadow-sm text-muted-foreground',
        outline: 'border border-border text-muted-foreground',
        ghost: 'bg-muted/50 text-muted-foreground',
    };

    const sizeClasses = {
        sm: 'text-[10px] px-1 py-0.5 min-w-[18px]',
        md: 'text-xs px-1.5 py-0.5 min-w-[22px]',
    };

    return (
        <kbd
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            {...props}
        >
            {children}
        </kbd>
    );
};

Kbd.displayName = 'Kbd';

// Atalhos comuns pré-formatados
export const KbdShortcut: React.FC<{
    keys: string[];
    size?: 'sm' | 'md';
    className?: string;
}> = ({ keys, size = 'sm', className = '' }) => (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
        {keys.map((key, i) => (
            <React.Fragment key={i}>
                <Kbd size={size} variant="ghost">{key}</Kbd>
                {i < keys.length - 1 && <span className="text-muted-foreground text-xs">+</span>}
            </React.Fragment>
        ))}
    </span>
);

export { Kbd };
export default Kbd;
