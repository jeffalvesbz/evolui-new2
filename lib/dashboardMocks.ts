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
const baseCardClasses = "glass-card";

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
  React.createElement('h3', { className: `text-xl font-bold tracking-tight font-display ${className || ''}` }, children)
);

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  React.createElement('div', { className: `text-sm text-muted-foreground ${className || ''}` }, children)
);

type ButtonVariant = 'primary' | 'outline' | 'default';
export const Button: React.FC<{ children: React.ReactNode; className?: string; variant?: ButtonVariant; onClick?: () => void; disabled?: boolean }> = ({ children, className, variant = 'default', ...props }) => {
  const baseClasses = 'h-10 px-4 py-2 inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none';
  const variantClasses = {
    primary: 'btn-gradient shadow-lg shadow-primary/20 hover:shadow-primary/40',
    outline: 'border border-white/10 bg-white/5 hover:bg-white/10 text-foreground backdrop-blur-sm',
    default: 'bg-muted/50 text-foreground hover:bg-muted/80 backdrop-blur-sm'
  }
  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${className || ''}`;
  return React.createElement('button', { ...props, className: finalClassName }, children);
};

export const Progress: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  React.createElement(
    'div',
    { className: `progress-modern ${className || ''}` },
    React.createElement('div', {
      className: "progress-bar",
      style: { width: `${Math.min(value, 100)}%` }
    })
  )
);

export const SectionHeader: React.FC<{ title: string, description: string }> = ({ title, description }) => (
  React.createElement('div', null,
    React.createElement('h2', { className: "text-3xl font-bold" }, title),
    React.createElement('p', { className: "text-muted-foreground mt-1" }, description)
  )
);