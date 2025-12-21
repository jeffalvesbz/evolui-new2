import React, { createContext, useContext, useState } from 'react';

// Context para comunicação entre Tabs, TabsList, TabsTrigger e TabsContent
interface TabsContextValue {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

// === Tabs (container principal) ===
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Valor da tab ativa (controlled) */
    value?: string;
    /** Valor inicial (uncontrolled) */
    defaultValue?: string;
    /** Callback quando tab muda */
    onValueChange?: (value: string) => void;
    /** Orientação das tabs */
    orientation?: 'horizontal' | 'vertical';
}

export const Tabs: React.FC<TabsProps> = ({
    children,
    value,
    defaultValue = '',
    onValueChange,
    orientation = 'horizontal',
    className = '',
    ...props
}) => {
    const [internalValue, setInternalValue] = useState(defaultValue);

    const activeTab = value !== undefined ? value : internalValue;

    const setActiveTab = (newValue: string) => {
        if (value === undefined) {
            setInternalValue(newValue);
        }
        onValueChange?.(newValue);
    };

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div
                className={`
          ${orientation === 'vertical' ? 'flex gap-4' : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
                data-orientation={orientation}
                {...props}
            >
                {children}
            </div>
        </TabsContext.Provider>
    );
};

// === TabsList (container dos triggers) ===
export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Variante visual */
    variant?: 'default' | 'pills' | 'underline';
}

export const TabsList: React.FC<TabsListProps> = ({
    children,
    variant = 'default',
    className = '',
    ...props
}) => {
    const variantClasses = {
        default: 'bg-muted rounded-lg p-1 inline-flex gap-1',
        pills: 'inline-flex gap-2',
        underline: 'border-b border-border inline-flex gap-1',
    };

    return (
        <div
            role="tablist"
            className={`
        ${variantClasses[variant]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            {...props}
        >
            {children}
        </div>
    );
};

// === TabsTrigger (botão de cada tab) ===
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Valor único da tab */
    value: string;
    /** Variante visual (herdado do TabsList ou override) */
    variant?: 'default' | 'pills' | 'underline';
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
    children,
    value,
    variant = 'default',
    className = '',
    disabled,
    ...props
}) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used within Tabs');

    const isActive = context.activeTab === value;

    const baseClasses = 'inline-flex items-center justify-center font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variantClasses = {
        default: `
      px-3 py-1.5 rounded-md
      ${isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }
    `,
        pills: `
      px-4 py-2 rounded-full
      ${isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }
    `,
        underline: `
      px-4 py-2 -mb-px
      ${isActive
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }
    `,
    };

    return (
        <button
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={disabled}
            onClick={() => context.setActiveTab(value)}
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            {...props}
        >
            {children}
        </button>
    );
};

// === TabsContent (conteúdo de cada tab) ===
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Valor correspondente ao TabsTrigger */
    value: string;
    /** Se deve manter montado quando não ativo */
    forceMount?: boolean;
}

export const TabsContent: React.FC<TabsContentProps> = ({
    children,
    value,
    forceMount = false,
    className = '',
    ...props
}) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used within Tabs');

    const isActive = context.activeTab === value;

    if (!isActive && !forceMount) return null;

    return (
        <div
            role="tabpanel"
            tabIndex={0}
            hidden={!isActive}
            className={`
        mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${isActive ? 'animate-in fade-in-50 duration-200' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            {...props}
        >
            {children}
        </div>
    );
};

Tabs.displayName = 'Tabs';
TabsList.displayName = 'TabsList';
TabsTrigger.displayName = 'TabsTrigger';
TabsContent.displayName = 'TabsContent';

export default Tabs;
