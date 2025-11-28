import React from 'react';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
    className?: string;
}

const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'medium',
    message = 'Carregando...',
    className = ''
}) => {
    return (
        <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
            <div className="flex flex-col items-center gap-4">
                <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`} />
                {message && (
                    <p className="text-sm text-muted-foreground">{message}</p>
                )}
            </div>
        </div>
    );
};

export default LoadingSpinner;
