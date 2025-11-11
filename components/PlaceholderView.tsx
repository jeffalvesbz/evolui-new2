import React from 'react';
import { LayersIcon } from './icons';

interface PlaceholderViewProps {
    viewName: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ viewName }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <LayersIcon className="w-24 h-24 text-muted-foreground/20 mb-6" />
            <h1 className="text-3xl font-bold text-foreground">Em breve: {viewName.charAt(0).toUpperCase() + viewName.slice(1)}</h1>
            <p className="max-w-md mt-2 text-muted-foreground">
                Esta funcionalidade está em desenvolvimento e estará disponível em breve para aprimorar ainda mais sua rotina de estudos.
            </p>
        </div>
    );
};

export default PlaceholderView;
