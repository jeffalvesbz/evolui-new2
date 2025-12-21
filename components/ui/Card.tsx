import React from 'react';

// Variantes de estilo do card
const cardVariants = {
  default: 'bg-card border-border',
  glass: 'bg-card/60 backdrop-blur-xl border-border',
  bordered: 'bg-card border-border border-2',
  elevated: 'bg-card border-border shadow-lg',
  muted: 'bg-muted/30 border-border',
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variante visual do card */
  variant?: keyof typeof cardVariants;
  /** Padding interno customizado */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Se deve ter hover effect */
  hoverable?: boolean;
}

const paddingSizes = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

/**
 * Componente Card padronizado com variantes e sub-componentes.
 * 
 * @example
 * // Card simples
 * <Card>Conteúdo</Card>
 * 
 * // Card com sub-componentes
 * <Card>
 *   <Card.Header>
 *     <Card.Title>Título</Card.Title>
 *   </Card.Header>
 *   <Card.Body>
 *     Conteúdo
 *   </Card.Body>
 *   <Card.Footer>
 *     <Button>Ação</Button>
 *   </Card.Footer>
 * </Card>
 */
const Card: React.FC<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
  Title: typeof CardTitle;
} = ({
  className = '',
  variant = 'glass',
  padding = 'none',
  hoverable = false,
  children,
  ...props
}) => {
    return (
      <div
        className={`
        rounded-xl border shadow-sm text-card-foreground
        ${cardVariants[variant]}
        ${paddingSizes[padding]}
        ${hoverable ? 'transition-all hover:border-primary/60 hover:shadow-md cursor-pointer' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {children}
      </div>
    );
  };

// Sub-componente Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Se deve ter borda inferior */
  bordered?: boolean;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  className = '',
  bordered = false,
  children,
  ...props
}) => (
  <div
    className={`
      p-6
      ${bordered ? 'border-b border-border' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ')}
    {...props}
  >
    {children}
  </div>
);

CardHeader.displayName = 'Card.Header';

// Sub-componente Body / Content (alias)
interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> { }

const CardBody: React.FC<CardBodyProps> = ({
  className = '',
  children,
  ...props
}) => (
  <div
    className={`p-6 pt-0 ${className}`.trim()}
    {...props}
  >
    {children}
  </div>
);

CardBody.displayName = 'Card.Body';

// Alias para compatibilidade
const CardContent = CardBody;
CardContent.displayName = 'Card.Content';

// Sub-componente Footer
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Se deve ter borda superior */
  bordered?: boolean;
}

const CardFooter: React.FC<CardFooterProps> = ({
  className = '',
  bordered = false,
  children,
  ...props
}) => (
  <div
    className={`
      p-6 pt-0 flex items-center justify-end gap-2
      ${bordered ? 'border-t border-border bg-muted/30 pt-4' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ')}
    {...props}
  >
    {children}
  </div>
);

CardFooter.displayName = 'Card.Footer';

// Sub-componente Title
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }

const CardTitle: React.FC<CardTitleProps> = ({
  className = '',
  children,
  ...props
}) => (
  <h3
    className={`text-lg font-semibold leading-none tracking-tight ${className}`.trim()}
    {...props}
  >
    {children}
  </h3>
);

CardTitle.displayName = 'Card.Title';

// Attach sub-components
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Title = CardTitle;

Card.displayName = 'Card';

// Named exports para compatibilidade com imports existentes
export { Card, CardHeader, CardBody, CardContent, CardFooter, CardTitle };
export default Card;
