import React, { useState, useEffect, useMemo } from 'react';
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
  SearchIcon,
} from './icons';
import { useRevisoes } from '../hooks/useRevisoes';
import RevisaoCard from './RevisaoCard';
import { toast } from './Sonner';
import { useEditalStore } from '../stores/useEditalStore';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';

type FiltroStatus = 'todas' | 'pendentes' | 'programadas' | 'atrasadas' | 'concluidas';
type FiltroDificuldade = 'todas' | 'fácil' | 'médio' | 'difícil';

const RevisoesPage: React.FC = () => {
  const editalAtivo = useEditalStore((state) => state.editalAtivo);
  const { fetchRevisoes } = useRevisoesStore();
  const findTopicById = useDisciplinasStore((state) => state.findTopicById);
  const {
    revisoes,
    pendentesHoje,
    programadas,
    programadasAmanha,
    programadasProximaSemana,
    programadasFuturas,
    atrasadas,
    concluidas,
    concluidasHoje,
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
  const [busca, setBusca] = useState('');

  // Garantir que as revisões sejam carregadas quando o componente é montado ou quando o edital muda
  useEffect(() => {
    if (editalAtivo?.id) {
      fetchRevisoes(editalAtivo.id).catch(err => {
        console.error("Erro ao carregar revisões:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editalAtivo?.id]);

  // Cache de informações de disciplina e tópico para busca
  const revisoesComInfo = useMemo(() => {
    return (revisoes || []).map(revisao => {
      const info = findTopicById(revisao.topico_id);
      return {
        revisao,
        disciplinaNome: info?.disciplina?.nome || '',
        topicoNome: info?.topico?.titulo || '',
      };
    });
  }, [revisoes, findTopicById]);

  const revisoesFiltradas = useMemo(() => {
    return revisoesComInfo.filter(({ revisao, disciplinaNome, topicoNome }) => {
      // Filtro por busca (conteúdo, disciplina, tópico)
      if (busca.trim()) {
        const buscaLower = busca.toLowerCase();
        const conteudoMatch = revisao.conteudo.toLowerCase().includes(buscaLower);
        const disciplinaMatch = disciplinaNome.toLowerCase().includes(buscaLower);
        const topicoMatch = topicoNome.toLowerCase().includes(buscaLower);
        if (!conteudoMatch && !disciplinaMatch && !topicoMatch) return false;
      }
      // Filtro por status
      if (filtroStatus !== 'todas') {
        if (filtroStatus === 'pendentes' && revisao.status !== 'pendente') return false;
        if (filtroStatus === 'atrasadas' && revisao.status !== 'atrasada') return false;
        if (filtroStatus === 'concluidas' && revisao.status !== 'concluida') return false;
      }
      // Filtro por dificuldade
      if (filtroDificuldade !== 'todas' && revisao.dificuldade !== filtroDificuldade) return false;
      return true;
    }).map(({ revisao }) => revisao);
  }, [revisoesComInfo, busca, filtroStatus, filtroDificuldade]);

  const handleRefresh = async () => {
    try {
      await atualizarStatusAtrasadas();
      toast.success('Dados atualizados!');
    } catch (err) {
      toast.error('Erro ao atualizar dados');
    }
  };

  const MetricCard: React.FC<{ title: string, value: number, icon: React.ElementType, color: string, subtitle?: string }> = ({ title, value, icon: Icon, color, subtitle }) => (
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

  const FilterButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isActive
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
    >
      {label}
    </button>
  );

  if (!editalAtivo?.id) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <CalendarDaysIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum Edital Selecionado</h2>
          <p className="text-sm text-muted-foreground">Selecione um edital para visualizar e gerenciar suas revisões.</p>
        </div>
      </div>
    );
  }

  if (loading && (!revisoes || revisoes.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <RefreshCwIcon className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Carregando revisões...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-tutorial="revisoes-content" className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Revisões do Dia</h1>
          <p className="text-muted-foreground">Gerencie suas revisões teóricas e manuais</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMostrarEstatisticas(!mostrarEstatisticas)} className="h-9 px-3 flex items-center gap-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:bg-muted" title="Estatísticas"><BarChart3Icon className="w-4 h-4" /></button>
          <button onClick={handleRefresh} disabled={loading} className="h-9 px-3 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50" title="Atualizar"><RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pendentes Hoje"
          value={pendentesHoje.length}
          icon={ClockIcon}
          color="bg-purple-500"
        />
        <MetricCard
          title="Atrasadas"
          value={atrasadas.length}
          icon={AlertCircleIcon}
          color="bg-red-500"
        />
        <MetricCard
          title="Programadas"
          value={programadas.length}
          icon={CalendarDaysIcon}
          color="bg-blue-500"
        />
        <MetricCard
          title="Concluídas"
          value={concluidas.length}
          icon={CheckCircle2Icon}
          color="bg-green-500"
          subtitle={`Taxa: ${estatisticas.taxaConclusao}%`}
        />
      </div>

      <AnimatePresence>
        {mostrarEstatisticas && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
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

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
          </div>
          {(filtroStatus !== 'todas' || filtroDificuldade !== 'todas' || busca.trim()) && (
            <button
              onClick={() => {
                setFiltroStatus('todas');
                setFiltroDificuldade('todas');
                setBusca('');
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Campo de busca */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por conteúdo, disciplina ou tópico..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todas">Todas</option>
              <option value="pendentes">Pendentes</option>
              <option value="atrasadas">Atrasadas</option>
              <option value="concluidas">Concluídas</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Dificuldade</label>
            <select
              value={filtroDificuldade}
              onChange={(e) => setFiltroDificuldade(e.target.value as FiltroDificuldade)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todas">Todas</option>
              <option value="fácil">Fácil</option>
              <option value="médio">Médio</option>
              <option value="difícil">Difícil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Daily Progress Bar */}
      {(pendentesHoje.length > 0 || concluidasHoje.length > 0) && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">
              {concluidasHoje.length}/{pendentesHoje.length + concluidasHoje.length} revisões do dia concluídas
            </p>
            <span className="text-xs text-muted-foreground">
              {Math.round((concluidasHoje.length / (pendentesHoje.length + concluidasHoje.length || 1)) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(concluidasHoje.length / (pendentesHoje.length + concluidasHoje.length || 1)) * 100}%`
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            />
          </div>
        </div>
      )}


      {/* Atrasadas - Highest Priority (always expanded if exists) */}
      {atrasadas.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-red-400 flex items-center gap-2">🚨 Revisões Atrasadas ({atrasadas.length})</h3>
          <AnimatePresence>
            {atrasadas.filter(r => revisoesFiltradas.includes(r)).map(r => <RevisaoCard key={r.id} revisao={r} onConcluir={concluirRevisao} onReagendar={reagendarRevisao} onRemover={removeRevisao} />)}
          </AnimatePresence>
        </section>
      )}

      {/* Pendentes Hoje - Second Priority (always expanded) */}
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
          <details className="group">
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