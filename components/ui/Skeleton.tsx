import React from 'react';

// Variantes de forma padrão
const skeletonVariants = {
  default: 'h-4 rounded',
  text: 'h-4 rounded',
  title: 'h-6 rounded w-1/2',
  avatar: 'rounded-full w-10 h-10',
  card: 'rounded-xl h-32',
  button: 'h-10 rounded-lg w-24',
  circle: 'rounded-full',
  rect: 'rounded-lg',
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variante de forma */
  variant?: keyof typeof skeletonVariants;
  /** Largura (CSS value) */
  width?: string | number;
  /** Altura (CSS value) */
  height?: string | number;
  /** Se deve ter animação de pulse */
  animate?: boolean;
  /** Número de linhas (para criar múltiplos skeletons) */
  lines?: number;
}

/**
 * Componente Skeleton para loading placeholders.
 * 
 * @example
 * // Texto simples
 * <Skeleton width="60%" />
 * 
 * // Avatar
 * <Skeleton variant="avatar" />
 * 
 * // Card
 * <Skeleton variant="card" />
 * 
 * // Múltiplas linhas
 * <Skeleton variant="text" lines={3} />
 * 
 * // Tamanho customizado
 * <Skeleton width={200} height={40} />
 */
const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'default',
  width,
  height,
  animate = true,
  lines = 1,
  style,
  ...props
}) => {
  // Múltiplas linhas
  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`
              bg-muted
              ${animate ? 'animate-pulse' : ''}
              ${skeletonVariants.text}
            `.trim().replace(/\s+/g, ' ')}
            style={{
              width: i === lines - 1 ? '75%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        bg-muted
        ${animate ? 'animate-pulse' : ''}
        ${skeletonVariants[variant]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
};

Skeleton.displayName = 'Skeleton';

export { Skeleton };
export default Skeleton;
