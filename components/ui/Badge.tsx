import React from 'react';

// Variantes de cor do badge
const badgeVariants = {
    default: 'bg-muted text-muted-foreground border-border',
    primary: 'bg-primary/10 text-primary border-primary/30',
    secondary: 'bg-secondary/10 text-secondary border-secondary/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/10 text-red-400 border-red-500/30',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    premium: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30',
    pro: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30',
};

// Tamanhos do badge
const badgeSizes = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Variante de cor */
    variant?: keyof typeof badgeVariants;
    /** Tamanho */
    size?: keyof typeof badgeSizes;
    /** Ícone à esquerda */
    icon?: React.ReactNode;
    /** Se deve ter borda */
    bordered?: boolean;
    /** Se deve ser pill (mais arredondado) */
    pill?: boolean;
}

/**
 * Componente Badge para exibir status, categorias, tags, etc.
 * 
 * @example
 * // Badge simples
 * <Badge>Novo</Badge>
 * 
 * // Badge de sucesso
 * <Badge variant="success">Concluído</Badge>
 * 
 * // Badge PRO
 * <Badge variant="pro" icon={<SparklesIcon />}>PRO</Badge>
 * 
 * // Badge de perigo com borda
 * <Badge variant="danger" bordered>Atrasado</Badge>
 */
const Badge: React.FC<BadgeProps> = ({
    className = '',
    variant = 'default',
    size = 'sm',
    icon,
    bordered = true,
    pill = true,
    children,
    ...props
}) => {
    return (
        <span
            className={`
        inline-flex items-center font-medium whitespace-nowrap
        ${bordered ? 'border' : ''}
        ${pill ? 'rounded-full' : 'rounded-md'}
        ${badgeVariants[variant]}
        ${badgeSizes[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            {...props}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </span>
    );
};

Badge.displayName = 'Badge';

export { Badge };
export default Badge;
