import React from 'react';
import { LayoutGridIcon, ChevronRightIcon } from './icons';

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
    // Não exibimos o breadcrumb no próprio dashboard, pois ele é a raiz.
    if (activeView === 'dashboard') {
        return null;
    }

    const currentItem = navItems.find(item => item.id === activeView);
    // Fallback para views não presentes na navegação (não deve acontecer na configuração atual)
    const currentLabel = currentItem ? currentItem.label : activeView.charAt(0).toUpperCase() + activeView.slice(1);

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