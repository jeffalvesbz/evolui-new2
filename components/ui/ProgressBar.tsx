import React from 'react';

// Variantes de cor
const progressVariants = {
    default: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    gradient: 'bg-gradient-to-r from-primary to-secondary',
};

// Tamanhos
const progressSizes = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4',
};

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Valor atual (0-100) */
    value: number;
    /** Valor máximo (default 100) */
    max?: number;
    /** Variante de cor */
    variant?: keyof typeof progressVariants;
    /** Tamanho */
    size?: keyof typeof progressSizes;
    /** Se deve mostrar o valor em porcentagem */
    showValue?: boolean;
    /** Posição do valor */
    valuePosition?: 'inside' | 'right' | 'top';
    /** Se deve ter animação de transição */
    animated?: boolean;
    /** Se deve ter efeito de stripe animado */
    striped?: boolean;
    /** Label acessível */
    label?: string;
    /** Cor personalizada (sobrepõe variant) */
    color?: string;
}

/**
 * Componente ProgressBar padronizado.
 * 
 * @example
 * <ProgressBar value={75} />
 * 
 * <ProgressBar value={50} variant="success" showValue />
 * 
 * <ProgressBar value={30} size="lg" striped animated />
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
    className = '',
    value,
    max = 100,
    variant = 'default',
    size = 'md',
    showValue = false,
    valuePosition = 'right',
    animated = true,
    striped = false,
    label,
    color,
    ...props
}) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const renderValue = () => (
        <span className="text-xs font-medium text-muted-foreground">
            {Math.round(percentage)}%
        </span>
    );

    return (
        <div className={`flex items-center gap-2 ${className}`} {...props}>
            {showValue && valuePosition === 'top' && (
                <div className="w-full flex justify-end mb-1">{renderValue()}</div>
            )}

            <div className="flex-1 flex items-center gap-2">
                <div
                    className={`
            flex-1 rounded-full bg-muted overflow-hidden
            ${progressSizes[size]}
          `.trim().replace(/\s+/g, ' ')}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                    aria-label={label}
                >
                    <div
                        className={`
              h-full rounded-full
              ${color ? '' : progressVariants[variant]}
              ${animated ? 'transition-all duration-500 ease-out' : ''}
              ${striped ? 'bg-stripes' : ''}
            `.trim().replace(/\s+/g, ' ')}
                        style={{
                            width: `${percentage}%`,
                            ...(color ? { backgroundColor: color } : {}),
                        }}
                    />
                </div>

                {showValue && valuePosition === 'right' && renderValue()}
            </div>
        </div>
    );
};

ProgressBar.displayName = 'ProgressBar';

// Componente de progresso circular
export interface CircularProgressProps {
    /** Valor atual (0-100) */
    value: number;
    /** Tamanho em pixels */
    size?: number;
    /** Espessura do traço */
    strokeWidth?: number;
    /** Variante de cor */
    variant?: keyof typeof progressVariants;
    /** Se deve mostrar o valor */
    showValue?: boolean;
    /** Conteúdo customizado no centro */
    children?: React.ReactNode;
    /** Classe CSS */
    className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    value,
    size = 48,
    strokeWidth = 4,
    variant = 'default',
    showValue = false,
    children,
    className = '',
}) => {
    const percentage = Math.min(100, Math.max(0, value));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Map variant to stroke color
    const strokeColors: Record<string, string> = {
        default: 'stroke-primary',
        success: 'stroke-emerald-500',
        warning: 'stroke-amber-500',
        danger: 'stroke-red-500',
        info: 'stroke-blue-500',
        gradient: 'stroke-primary', // Gradient não funciona bem em SVG stroke
    };

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className="stroke-muted"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className={`${strokeColors[variant]} transition-all duration-500 ease-out`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            {(showValue || children) && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {children || (
                        <span className="text-xs font-semibold text-foreground">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

CircularProgress.displayName = 'CircularProgress';

export { ProgressBar };
export default ProgressBar;
