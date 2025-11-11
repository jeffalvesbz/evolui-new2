import React from 'react';
import { FootprintsIcon } from '../icons';

interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="text-center p-6 border-2 border-dashed border-border rounded-lg text-muted-foreground">
      <div className="flex justify-center mb-3">
        <FootprintsIcon className="w-12 h-12 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium mb-1">
        {message || 'Seu plano está vazio!'}
      </p>
      <p className="text-xs">
        Arraste os tópicos do backlog para cá para começar.
      </p>
      {/* Seta animada apontando para o backlog */}
      <div className="mt-4 flex items-center justify-center">
        <div className="animate-pulse">
          <svg 
            className="w-6 h-6 text-primary/50 transform -rotate-90" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 8l4 4m0 0l-4 4m4-4H3" 
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;




