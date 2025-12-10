import React, { useState } from 'react';

interface TooltipProps {
    children: React.ReactNode;
}

interface TooltipTriggerProps {
    asChild?: boolean;
    children: React.ReactNode;
}

interface TooltipContentProps {
    children: React.ReactNode;
}

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

export const Tooltip: React.FC<TooltipProps> = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);

    // Clone children to pass visibility state if needed, but for simple implementation
    // we'll rely on context or just composition.
    // Actually, to keep it simple without Context for now (unless needed),
    // we can just assume Tooltip wraps Trigger and Content.

    // A better simple implementation:
    return (
        <div className="relative inline-block group">
            {children}
        </div>
    );
};

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children }) => {
    return <div className="inline-block">{children}</div>;
};

export const TooltipContent: React.FC<TooltipContentProps> = ({ children }) => {
    return (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-black rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap">
            {children}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black" />
        </div>
    );
};
