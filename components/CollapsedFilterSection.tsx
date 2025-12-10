import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import Input from './ui/Input';
import { SearchIcon, FilterIcon, CalendarDaysIcon, ChevronDownIcon, ChevronUpIcon, XIcon } from './icons';

interface CollapsedFilterSectionProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterOrigem: string;
    setFilterOrigem: (origem: string) => void;
    filterData: string;
    setFilterData: (data: string) => void;
    dataInicio: string;
    setDataInicio: (data: string) => void;
    dataFim: string;
    setDataFim: (data: string) => void;
}

const CollapsedFilterSection: React.FC<CollapsedFilterSectionProps> = ({
    searchTerm,
    setSearchTerm,
    filterOrigem,
    setFilterOrigem,
    filterData,
    setFilterData,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Contar filtros ativos
    const activeFiltersCount = [
        filterOrigem !== 'all' ? 1 : 0,
        filterData !== 'all' ? 1 : 0,
        searchTerm ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterOrigem('all');
        setFilterData('all');
        setDataInicio('');
        setDataFim('');
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <Card className="border-border shadow-sm">
            <CardContent className="p-4">
                {/* Header colapsável */}
                <button
                    onClick={toggleExpanded}
                    className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                >
                    <div className="flex items-center gap-3">
                        <FilterIcon className="w-5 h-5 text-primary" />
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Filtros
                                {activeFiltersCount > 0 && (
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        ({activeFiltersCount} {activeFiltersCount === 1 ? 'ativo' : 'ativos'})
                                    </span>
                                )}
                            </h3>
                            {!isExpanded && activeFiltersCount === 0 && (
                                <p className="text-xs text-muted-foreground">Clique para filtrar resultados</p>
                            )}
                        </div>
                    </div>
                    {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-muted-foreground" />
                    ) : (
                        <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                </button>

                {/* Conteúdo expandido */}
                {isExpanded && (
                    <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Busca */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Buscar
                            </label>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por disciplina, tópico ou simulado..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Tipo */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Tipo
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {['all', 'manual', 'timer', 'ciclo_estudos', 'trilha', 'simulado'].map((origem) => (
                                    <button
                                        key={origem}
                                        onClick={() => setFilterOrigem(origem)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${filterOrigem === origem
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {origem === 'all'
                                            ? 'Todos'
                                            : origem === 'ciclo_estudos'
                                                ? 'Ciclo'
                                                : origem === 'trilha'
                                                    ? 'Trilha'
                                                    : origem.charAt(0).toUpperCase() + origem.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Período */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Período
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {['all', 'hoje', '7dias', '30dias', 'custom'].map((periodo) => (
                                    <button
                                        key={periodo}
                                        onClick={() => setFilterData(periodo)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${filterData === periodo
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {periodo === 'all'
                                            ? 'Tudo'
                                            : periodo === '7dias'
                                                ? '7 dias'
                                                : periodo === '30dias'
                                                    ? '30 dias'
                                                    : periodo === 'custom'
                                                        ? 'Personalizado'
                                                        : periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Datas personalizadas */}
                            {filterData === 'custom' && (
                                <div className="flex gap-3 items-center mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Input
                                        type="date"
                                        value={dataInicio}
                                        onChange={(e) => setDataInicio(e.target.value)}
                                        className="flex-1"
                                    />
                                    <span className="text-xs text-muted-foreground">até</span>
                                    <Input
                                        type="date"
                                        value={dataFim}
                                        onChange={(e) => setDataFim(e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Botão limpar filtros */}
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                            >
                                <XIcon className="w-4 h-4" />
                                Limpar filtros
                            </button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CollapsedFilterSection;
