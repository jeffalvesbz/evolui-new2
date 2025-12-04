import React from 'react';
import { LayoutGridIcon, ChevronRightIcon } from './icons';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';

const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'planejamento', label: 'Planejamento' },
    { id: 'ciclos', label: 'Ciclos de Estudos' },
    { id: 'edital', label: 'Edital' },
    { id: 'estatisticas', label: 'Estatísticas' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'revisoes', label: 'Revisões' },
    { id: 'erros', label: 'Caderno de Erros' },
    { id: 'historico', label: 'Histórico' },
    { id: 'simulados', label: 'Simulados' },
    { id: 'corretor', label: 'Corretor de Redação' },
];

interface BreadcrumbProps {
    activeView: string;
    setActiveView: (view: string) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ activeView, setActiveView }) => {
    const { breadcrumbs } = useBreadcrumb();

    // Se há breadcrumbs customizados, usar eles
    if (breadcrumbs.length > 0) {
        return (
            <nav className="flex items-center text-sm text-muted-foreground" aria-label="Breadcrumb">
                <button
                    onClick={() => setActiveView('dashboard')}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    aria-label="Ir para o Dashboard"
                >
                    <LayoutGridIcon className="w-4 h-4" />
                    <span>Início</span>
                </button>
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                        <ChevronRightIcon className="w-4 h-4 mx-1.5 text-border" />
                        {crumb.view ? (
                            <button
                                onClick={() => setActiveView(crumb.view!)}
                                className="hover:text-foreground transition-colors"
                            >
                                {crumb.label}
                            </button>
                        ) : (
                            <span className={index === breadcrumbs.length - 1 ? 'font-medium text-foreground' : ''}>
                                {crumb.label}
                            </span>
                        )}
                    </React.Fragment>
                ))}
            </nav>
        );
    }

    // Breadcrumb padrão baseado na view atual
    const currentItem = navItems.find(item => item.id === activeView);
    const currentLabel = currentItem ? currentItem.label : activeView.charAt(0).toUpperCase() + activeView.slice(1);

    // Mostrar breadcrumb também no Dashboard, mas de forma mais sutil
    if (activeView === 'dashboard') {
        return (
            <nav className="flex items-center text-sm text-muted-foreground" aria-label="Breadcrumb">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                    <LayoutGridIcon className="w-4 h-4" />
                    <span>Dashboard</span>
                </span>
            </nav>
        );
    }

    return (
        <nav className="flex items-center text-sm text-muted-foreground" aria-label="Breadcrumb">
            <button
                onClick={() => setActiveView('dashboard')}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                aria-label="Ir para o Dashboard"
            >
                <LayoutGridIcon className="w-4 h-4" />
                <span>Início</span>
            </button>
            
            <ChevronRightIcon className="w-4 h-4 mx-1.5 text-border" />
            
            <span className="font-medium text-foreground" aria-current="page">
                {currentLabel}
            </span>
        </nav>
    );
};

export default Breadcrumb;
