import React from 'react';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Ícone grande centralizado */
    icon?: React.ReactNode;
    /** Título principal */
    title: string;
    /** Descrição/subtítulo */
    description?: string;
    /** Texto do botão de ação */
    actionLabel?: string;
    /** Callback do botão de ação */
    onAction?: () => void;
    /** Props extras para o botão */
    actionProps?: Omit<ButtonProps, 'onClick' | 'children'>;
    /** Tamanho do empty state */
    size?: 'sm' | 'md' | 'lg';
}

const sizes = {
    sm: {
        container: 'py-6',
        iconClass: 'w-10 h-10',
        title: 'text-base',
        description: 'text-sm',
    },
    md: {
        container: 'py-10',
        iconClass: 'w-12 h-12',
        title: 'text-lg',
        description: 'text-sm',
    },
    lg: {
        container: 'py-16',
        iconClass: 'w-16 h-16',
        title: 'text-xl',
        description: 'text-base',
    },
};

/**
 * Componente EmptyState para exibir quando listas estão vazias.
 * 
 * @example
 * // Empty state simples
 * <EmptyState 
 *   title="Nenhum flashcard encontrado"
 *   description="Crie seu primeiro flashcard para começar"
 * />
 * 
 * // Com ícone e ação
 * <EmptyState 
 *   icon={<BookOpenIcon className="w-12 h-12" />}
 *   title="Nenhuma disciplina"
 *   description="Adicione disciplinas para organizar seus estudos"
 *   actionLabel="Adicionar Disciplina"
 *   onAction={() => openModal()}
 * />
 * 
 * // Tamanho pequeno
 * <EmptyState 
 *   size="sm"
 *   title="Lista vazia"
 * />
 */
const EmptyState: React.FC<EmptyStateProps> = ({
    className = '',
    icon,
    title,
    description,
    actionLabel,
    onAction,
    actionProps,
    size = 'md',
    children,
    ...props
}) => {
    const sizeConfig = sizes[size];

    return (
        <div
            className={`
        flex flex-col items-center justify-center text-center
        ${sizeConfig.container}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            {...props}
        >
            {icon && (
                <div className="text-muted-foreground/40 mb-4">
                    {React.isValidElement(icon)
                        ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                            className: `${sizeConfig.iconClass} ${(icon as React.ReactElement<{ className?: string }>).props.className || ''}`,
                        })
                        : icon}
                </div>
            )}

            <h3 className={`font-semibold text-foreground ${sizeConfig.title}`}>
                {title}
            </h3>

            {description && (
                <p className={`mt-1 text-muted-foreground max-w-md ${sizeConfig.description}`}>
                    {description}
                </p>
            )}

            {/* Custom children slot */}
            {children && <div className="mt-4">{children}</div>}

            {actionLabel && onAction && (
                <Button
                    variant="primary"
                    size={size === 'sm' ? 'sm' : 'md'}
                    onClick={onAction}
                    className="mt-4"
                    {...actionProps}
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

EmptyState.displayName = 'EmptyState';

export { EmptyState };
export default EmptyState;
