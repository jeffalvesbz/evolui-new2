import React from 'react';

// Mocks for Core Logic
export class SyncManager {
  static getInstance() {
    return {
      invalidateAllCaches: () => {
        console.log('[MOCK] Invalidating all caches');
      },
      syncAll: async (editalId: string) => {
        console.log(`[MOCK] Syncing all for edital ${editalId}`);
        return Promise.resolve();
      },
    };
  }
}

// Mocks for UI Components -> Replaced with styled components
const baseCardClasses = "bg-card/60 backdrop-blur-xl border border-white/10 rounded-xl text-card-foreground shadow-sm";

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    React.createElement('div', { className: `${baseCardClasses} ${className || ''}` }, children)
);

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    React.createElement('div', { className: `p-6 ${className || ''}` }, children)
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    React.createElement('div', { className: `p-6 pt-0 ${className || ''}` }, children)
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    React.createElement('h3', { className: `text-xl font-bold tracking-tight ${className || ''}` }, children)
);

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    React.createElement('div', { className: `text-sm text-muted-foreground ${className || ''}` }, children)
);

type ButtonVariant = 'primary' | 'outline' | 'default';
export const Button: React.FC<{ children: React.ReactNode; className?: string; variant?: ButtonVariant; onClick?: () => void; disabled?: boolean }> = ({ children, className, variant = 'default', ...props }) => {
    const baseClasses = 'h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';
    const variantClasses = {
        primary: 'bg-gradient-to-tr from-primary to-secondary text-black font-bold',
        outline: 'border border-border bg-transparent hover:bg-accent',
        default: 'bg-muted text-foreground hover:bg-muted/80'
    }
    const finalClassName = `${baseClasses} ${variantClasses[variant]} ${className || ''}`;
    return React.createElement('button', { ...props, className: finalClassName }, children);
};

export const Progress: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  React.createElement(
    'div',
    { className: `w-full bg-muted/30 rounded-full h-2.5 ${className || ''}` },
    React.createElement('div', {
      className: "bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full",
      style: { width: `${Math.min(value, 100)}%` } // Limita visualmente a 100% mas permite valores maiores para exibição
    })
  )
);

export const SectionHeader: React.FC<{ title: string, description: string }> = ({ title, description }) => (
    React.createElement('div', null,
        React.createElement('h2', { className: "text-3xl font-bold" }, title),
        React.createElement('p', { className: "text-muted-foreground mt-1" }, description)
    )
);