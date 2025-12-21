import React from 'react';

// Tamanhos do avatar
const avatarSizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
};

// Status indicator sizes
const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4',
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    /** URL da imagem */
    src?: string | null;
    /** Alt text da imagem */
    alt?: string;
    /** Nome para gerar iniciais (fallback quando não há imagem) */
    name?: string;
    /** Tamanho do avatar */
    size?: keyof typeof avatarSizes;
    /** Status indicator */
    status?: 'online' | 'offline' | 'away' | 'busy';
    /** Se deve ter borda */
    bordered?: boolean;
    /** Cor de fundo customizada para iniciais */
    bgColor?: string;
}

/**
 * Componente Avatar com imagem, fallback para iniciais e status indicator.
 * 
 * @example
 * // Com imagem
 * <Avatar src="/foto.jpg" alt="João" />
 * 
 * // Com iniciais (fallback)
 * <Avatar name="João Silva" />
 * 
 * // Com status
 * <Avatar name="Maria" status="online" />
 * 
 * // Tamanho grande
 * <Avatar name="Pedro" size="xl" />
 */
const Avatar: React.FC<AvatarProps> = ({
    className = '',
    src,
    alt,
    name,
    size = 'md',
    status,
    bordered = false,
    bgColor,
    ...props
}) => {
    const [imgError, setImgError] = React.useState(false);

    // Gerar iniciais do nome
    const getInitials = (name?: string): string => {
        if (!name) return '?';
        const words = name.trim().split(/\s+/);
        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
        }
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    // Gerar cor de fundo baseada no nome (consistente)
    const getColorFromName = (name?: string): string => {
        if (!name) return 'bg-muted';
        const colors = [
            'bg-red-500',
            'bg-orange-500',
            'bg-amber-500',
            'bg-yellow-500',
            'bg-lime-500',
            'bg-green-500',
            'bg-emerald-500',
            'bg-teal-500',
            'bg-cyan-500',
            'bg-sky-500',
            'bg-blue-500',
            'bg-indigo-500',
            'bg-violet-500',
            'bg-purple-500',
            'bg-fuchsia-500',
            'bg-pink-500',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const statusColors = {
        online: 'bg-emerald-500',
        offline: 'bg-gray-400',
        away: 'bg-amber-500',
        busy: 'bg-red-500',
    };

    const showImage = src && !imgError;

    return (
        <div className={`relative inline-block ${className}`} {...props}>
            <div
                className={`
          rounded-full flex items-center justify-center overflow-hidden
          ${avatarSizes[size]}
          ${bordered ? 'ring-2 ring-border' : ''}
          ${!showImage ? (bgColor || getColorFromName(name)) : 'bg-muted'}
        `.trim().replace(/\s+/g, ' ')}
            >
                {showImage ? (
                    <img
                        src={src}
                        alt={alt || name || 'Avatar'}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span className="font-semibold text-white select-none">
                        {getInitials(name)}
                    </span>
                )}
            </div>

            {status && (
                <span
                    className={`
            absolute bottom-0 right-0 rounded-full ring-2 ring-card
            ${statusSizes[size]}
            ${statusColors[status]}
          `.trim().replace(/\s+/g, ' ')}
                    aria-label={`Status: ${status}`}
                />
            )}
        </div>
    );
};

Avatar.displayName = 'Avatar';

// AvatarGroup para múltiplos avatares empilhados
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Avatares filhos */
    children: React.ReactNode;
    /** Máximo de avatares visíveis */
    max?: number;
    /** Tamanho dos avatares */
    size?: keyof typeof avatarSizes;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
    children,
    max = 4,
    size = 'md',
    className = '',
    ...props
}) => {
    const childArray = React.Children.toArray(children);
    const visibleChildren = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    return (
        <div className={`flex -space-x-2 ${className}`} {...props}>
            {visibleChildren.map((child, index) => (
                <div key={index} className="relative" style={{ zIndex: visibleChildren.length - index }}>
                    {React.isValidElement(child)
                        ? React.cloneElement(child as React.ReactElement<AvatarProps>, {
                            bordered: true,
                            size,
                        })
                        : child}
                </div>
            ))}
            {remainingCount > 0 && (
                <div
                    className={`
            relative rounded-full flex items-center justify-center
            bg-muted text-muted-foreground font-semibold ring-2 ring-card
            ${avatarSizes[size]}
          `.trim().replace(/\s+/g, ' ')}
                    style={{ zIndex: 0 }}
                >
                    +{remainingCount}
                </div>
            )}
        </div>
    );
};

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar };
export default Avatar;
