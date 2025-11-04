import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  CheckCircle2Icon, 
  AlertCircleIcon, 
  TrendingUpIcon,
  FilterIcon,
  RefreshCwIcon,
  PlusIcon,
  BarChart3Icon,
  TargetIcon,
} from './icons';
import { useRevisoes } from '../hooks/useRevisoes';
import RevisaoCard from './RevisaoCard';
import { toast } from './Sonner';
import { useEditalStore } from '../stores/useEditalStore';

type FiltroStatus = 'todas' | 'pendentes' | 'programadas' | 'atrasadas' | 'concluidas';
type FiltroDificuldade = 'todas' | 'fácil' | 'médio' | 'difícil';

const RevisoesPage: React.FC = () => {
  const editalAtivo = useEditalStore((state) => state.editalAtivo);
  const {
    revisoes,
    pendentesHoje,
    programadas,
    programadasAmanha,
    programadasProximaSemana,
    programadasFuturas,
    atrasadas,
    concluidas,
    estatisticas,
    concluirRevisao,
    reagendarRevisao,
    removeRevisao,
    atualizarStatusAtrasadas,
    loading,
    error,
  } = useRevisoes();

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');
  const [filtroDificuldade, setFiltroDificuldade] = useState<FiltroDificuldade>('todas');
  const [mostrarEstatisticas, setMostrarEstatisticas] = useState(false);

  const revisoesFiltradas = (revisoes || []).filter(revisao => {
    if (filtroStatus !== 'todas') {
      if (filtroStatus === 'pendentes' && revisao.status !== 'pendente') return false;
      if (filtroStatus === 'programadas' && revisao.status !== 'pendente') return false;
      if (filtroStatus === 'atrasadas' && revisao.status !== 'atrasada') return false;
      if (filtroStatus === 'concluidas' && revisao.status !== 'concluida') return false;
    }
    if (filtroDificuldade !== 'todas' && revisao.dificuldade !== filtroDificuldade) return false;
    return true;
  });

  const handleRefresh = async () => {
    try {
      await atualizarStatusAtrasadas();
      toast.success('Dados atualizados!');
    } catch (err) {
      toast.error('Erro ao atualizar dados');
    }
  };

  const MetricCard: React.FC<{title: string, value: number, icon: React.ElementType, color: string, subtitle?: string}> = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const FilterButton: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
        isActive ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
      }`}
    >
      {label}
    </button>
  );

  if (!editalAtivo?.id) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <CalendarDaysIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Nenhum Edital Selecionado</h2>
          <p className="text-muted-foreground">Selecione um edital para visualizar e gerenciar suas revisões.</p>
        </div>
      </div>
    );
  }

  if (loading && (!revisoes || revisoes.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCwIcon className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando revisões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Sistema de Revisões</h1>
          <p className="text-muted-foreground">Gerencie suas revisões de estudos teóricos e manuais.</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setMostrarEstatisticas(!mostrarEstatisticas)} className="h-9 px-3 flex items-center gap-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:bg-muted"><BarChart3Icon className="w-4 h-4" /> Estatísticas</button>
            <button onClick={handleRefresh} disabled={loading} className="h-9 px-3 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"><RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Pendentes Hoje" value={pendentesHoje.length} icon={ClockIcon} color="bg-primary" />
          <MetricCard title="Programadas" value={programadas.length} icon={CalendarDaysIcon} color="bg-secondary" />
          <MetricCard title="Atrasadas" value={atrasadas.length} icon={AlertCircleIcon} color="bg-red-500" />
          <MetricCard title="Concluídas" value={concluidas.length} icon={CheckCircle2Icon} color="bg-green-500" subtitle={`Taxa: ${estatisticas.taxaConclusao}%`} />
      </div>

      <AnimatePresence>
        {mostrarEstatisticas && (
          <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-xl border border-border bg-card p-6 mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUpIcon className="w-5 h-5" /> Estatísticas Detalhadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Por Origem</h4>
                        <div className="space-y-2 text-sm">{Object.entries(estatisticas.porOrigem).map(([k, v]: [string, number]) => <div key={k} className="flex justify-between items-center"><span className="capitalize text-foreground">{k}</span><span className="font-mono text-muted-foreground">{v}</span></div>)}</div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Por Dificuldade</h4>
                        <div className="space-y-2 text-sm">{Object.entries(estatisticas.porDificuldade).map(([k, v]: [string, number]) => <div key={k} className="flex justify-between items-center"><span className="capitalize text-foreground">{k}</span><span className="font-mono text-muted-foreground">{v}</span></div>)}</div>
                    </div>
                </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-4 mb-3">
          <FilterIcon className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-semibold w-20">Status:</span>
                <FilterButton label="Todas" isActive={filtroStatus === 'todas'} onClick={() => setFiltroStatus('todas')} />
                <FilterButton label="Pendentes" isActive={filtroStatus === 'pendentes'} onClick={() => setFiltroStatus('pendentes')} />
                <FilterButton label="Atrasadas" isActive={filtroStatus === 'atrasadas'} onClick={() => setFiltroStatus('atrasadas')} />
                <FilterButton label="Concluídas" isActive={filtroStatus === 'concluidas'} onClick={() => setFiltroStatus('concluidas')} />
            </div>
        </div>
      </div>
      
      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">📅 Revisões de Hoje ({pendentesHoje.length})</h3>
        {pendentesHoje.length > 0 ? (
          <AnimatePresence>
            {pendentesHoje.filter(r => revisoesFiltradas.includes(r)).map(r => <RevisaoCard key={r.id} revisao={r} onConcluir={concluirRevisao} onReagendar={reagendarRevisao} onRemover={removeRevisao} />)}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12 rounded-xl border-2 border-dashed border-border bg-card">
              <TargetIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Nenhuma revisão pendente para hoje 🎉</p>
          </div>
        )}
      </section>

      <div className="mt-8 space-y-6">
        {programadasAmanha.length > 0 && (
          <details className="group" open>
            <summary className="cursor-pointer text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-2 text-lg font-medium">🗓️ Amanhã ({programadasAmanha.length})</summary>
            <div className="mt-4 space-y-4">
              <AnimatePresence>
                {programadasAmanha.filter(r => revisoesFiltradas.includes(r)).map(r => <RevisaoCard key={r.id} revisao={r} onConcluir={concluirRevisao} onReagendar={reagendarRevisao} onRemover={removeRevisao} />)}
              </AnimatePresence>
            </div>
          </details>
        )}
        {programadasProximaSemana.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-2 text-lg font-medium">📅 Próxima Semana ({programadasProximaSemana.length})</summary>
            <div className="mt-4 space-y-4">
              <AnimatePresence>
                {programadasProximaSemana.filter(r => revisoesFiltradas.includes(r)).map(r => <RevisaoCard key={r.id} revisao={r} onConcluir={concluirRevisao} onReagendar={reagendarRevisao} onRemover={removeRevisao} />)}
              </AnimatePresence>
            </div>
          </details>
        )}
        {programadasFuturas.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-2 text-lg font-medium">🔭 Futuras ({programadasFuturas.length})</summary>
            <div className="mt-4 space-y-4">
              <AnimatePresence>
                {programadasFuturas.filter(r => revisoesFiltradas.includes(r)).map(r => <RevisaoCard key={r.id} revisao={r} onConcluir={concluirRevisao} onReagendar={reagendarRevisao} onRemover={removeRevisao} />)}
              </AnimatePresence>
            </div>
          </details>
        )}

        <details className="group">
          <summary className="cursor-pointer text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 text-lg font-medium">🚨 Ver revisões atrasadas ({atrasadas.length})</summary>
          <div className="mt-4 space-y-4">
            <AnimatePresence>
              {atrasadas.filter(r => revisoesFiltradas.includes(r)).map(r => <RevisaoCard key={r.id} revisao={r} onConcluir={concluirRevisao} onReagendar={reagendarRevisao} onRemover={removeRevisao} />)}
            </AnimatePresence>
          </div>
        </details>
        <details className="group">
          <summary className="cursor-pointer text-primary hover:text-primary/80 transition-colors flex items-center gap-2 text-lg font-medium">✅ Ver revisões concluídas ({concluidas.length})</summary>
          <div className="mt-4 space-y-4">
            <AnimatePresence>
              {concluidas.filter(r => revisoesFiltradas.includes(r)).map(r => <RevisaoCard key={r.id} revisao={r} onConcluir={concluirRevisao} onReagendar={reagendarRevisao} onRemover={removeRevisao} />)}
            </AnimatePresence>
          </div>
        </details>
      </div>
    </div>
  );
};

export default RevisoesPage;