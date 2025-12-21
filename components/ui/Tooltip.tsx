import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

// Context para comunicação entre Tooltip, Trigger e Content
interface TooltipContextValue {
    isVisible: boolean;
    setIsVisible: (v: boolean) => void;
    triggerRef: React.RefObject<HTMLElement>;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

// === TooltipProvider (para compatibilidade) ===
export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

// === Tooltip (compound component wrapper) ===
interface TooltipProps {
    children: React.ReactNode;
    /** Delay em ms antes de mostrar */
    delayDuration?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, delayDuration = 200 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const triggerRef = useRef<HTMLElement>(null);

    return (
        <TooltipContext.Provider value={{ isVisible, setIsVisible, triggerRef }}>
            <div className="relative inline-block">{children}</div>
        </TooltipContext.Provider>
    );
};

// === TooltipTrigger ===
interface TooltipTriggerProps {
    asChild?: boolean;
    children: React.ReactNode;
}

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children, asChild }) => {
    const context = useContext(TooltipContext);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            context?.setIsVisible(true);
        }, 200);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        context?.setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            onFocus: handleMouseEnter,
            onBlur: handleMouseLeave,
        });
    }

    return (
        <div
            className="inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleMouseEnter}
            onBlur={handleMouseLeave}
        >
            {children}
        </div>
    );
};

// === TooltipContent ===
interface TooltipContentProps {
    children: React.ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

export const TooltipContent: React.FC<TooltipContentProps> = ({
    children,
    side = 'top',
    className = '',
}) => {
    const context = useContext(TooltipContext);

    if (!context?.isVisible) return null;

    const positionClasses = {
        top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 transform -translate-x-1/2 border-t-foreground',
        bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-foreground',
        left: 'left-full top-1/2 transform -translate-y-1/2 border-l-foreground',
        right: 'right-full top-1/2 transform -translate-y-1/2 border-r-foreground',
    };

    return (
        <div
            role="tooltip"
            className={`
        absolute z-[200] px-2.5 py-1.5 text-xs font-medium
        bg-foreground text-background rounded-md shadow-lg
        pointer-events-none whitespace-nowrap
        animate-in fade-in-0 zoom-in-95 duration-150
        ${positionClasses[side]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
        >
            {children}
            <div
                className={`absolute border-4 border-transparent ${arrowClasses[side]}`}
            />
        </div>
    );
};

// === SimpleTooltip (versão simplificada para uso rápido) ===
export interface SimpleTooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    disabled?: boolean;
}

/**
 * Tooltip simplificado para uso inline rápido.
 * 
 * @example
 * <SimpleTooltip content="Salvar documento">
 *   <button>💾</button>
 * </SimpleTooltip>
 */
export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
    content,
    children,
    position = 'top',
    delay = 200,
    disabled = false,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (disabled) return;
        timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const positionClasses = {
        top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };

    return (
        <div className="relative inline-block">
            {React.cloneElement(children, {
                onMouseEnter: (e: React.MouseEvent) => {
                    handleMouseEnter();
                    children.props.onMouseEnter?.(e);
                },
                onMouseLeave: (e: React.MouseEvent) => {
                    handleMouseLeave();
                    children.props.onMouseLeave?.(e);
                },
            })}
            {isVisible && (
                <div
                    role="tooltip"
                    className={`
            absolute z-[200] px-2.5 py-1.5 text-xs font-medium
            bg-foreground text-background rounded-md shadow-lg
            pointer-events-none whitespace-nowrap
            animate-in fade-in-0 zoom-in-95 duration-150
            ${positionClasses[position]}
          `.trim().replace(/\s+/g, ' ')}
                >
                    {content}
                </div>
            )}
        </div>
    );
};

export default Tooltip;
