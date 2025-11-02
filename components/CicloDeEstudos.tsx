
import React, { useState, useMemo } from 'react';
import { useCiclosStore } from '../stores/useCiclosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { RepeatIcon, PlusIcon, EditIcon, Trash2Icon, SaveIcon, XIcon, ClockIcon, PlusCircleIcon, ArrowUpIcon, ArrowDownIcon, PlayIcon, StarIcon } from './icons';
import { toast } from './Sonner';
import { useModalStore } from '../stores/useModalStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Ciclo, SessaoCiclo } from '../types';

// Helper to format time
const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m > 0 ? `${m}min` : ''}`.trim();
    return `${m}min`;
};

const COLORS = ['#3B82F6', '#22C55E', '#F97316', '#A855F7', '#EC4899', '#6366F1', '#F59E0B'];

const CicloDeEstudos: React.FC = () => {
    const {
        ciclos,
        cicloAtivoId,
        getCicloAtivo,
        setCicloAtivoId,
        updateCiclo,
        removeCiclo,
        addSessaoAoCiclo,
        removeSessaoDoCiclo,
        ultimaSessaoConcluidaId,
        reordenarSessao,
    } = useCiclosStore();
    const { disciplinas } = useDisciplinasStore();
    const { iniciarSessao } = useEstudosStore();
    const openCriarCicloModal = useModalStore(state => state.openCriarCicloModal);
    
    const [isEditingCiclo, setIsEditingCiclo] = useState(false);
    const [editedCicloName, setEditedCicloName] = useState('');
    const [isAddingSessao, setIsAddingSessao] = useState(false);
    const [novaSessaoData, setNovaSessaoData] = useState({ disciplinaId: '', tempoMinutos: '60' });

    const cicloAtivo = useMemo(() => getCicloAtivo(), [cicloAtivoId, ciclos, getCicloAtivo]);

    const disciplinasMap = useMemo<Map<string, string>>(() => new Map(disciplinas.map(d => [d.id, d.nome])), [disciplinas]);

    const { totalTempoCiclo, dadosGrafico, proximaSessao } = useMemo(() => {
        if (!cicloAtivo) return { totalTempoCiclo: 0, dadosGrafico: [], proximaSessao: null };
        
        const sessoesOrdenadas = [...(cicloAtivo.sessoes || [])].sort((a, b) => a.ordem - b.ordem);
        
        const tempoTotal = sessoesOrdenadas.reduce((acc: number, s) => acc + Number(s.tempo_previsto || 0), 0);
        
        const dadosGrafico = sessoesOrdenadas.map(sessao => ({
            name: disciplinasMap.get(sessao.disciplina_id) || 'Desconhecida',
            value: Math.round(Number(sessao.tempo_previsto || 0) / 60)
        }));
        
        // Lógica para encontrar a próxima sessão
        let proxima: SessaoCiclo | null = null;
        if (sessoesOrdenadas.length > 0) {
            if (!ultimaSessaoConcluidaId) {
                proxima = sessoesOrdenadas[0];
            } else {
                const ultimoIndice = sessoesOrdenadas.findIndex(s => s.id === ultimaSessaoConcluidaId);
                proxima = sessoesOrdenadas[(ultimoIndice + 1) % sessoesOrdenadas.length];
            }
        }

        return { totalTempoCiclo: tempoTotal, dadosGrafico, proximaSessao: proxima };
    }, [cicloAtivo, disciplinasMap, ultimaSessaoConcluidaId]);
    
    const handleUpdateCicloName = () => {
        if (cicloAtivo && editedCicloName.trim() && editedCicloName.trim() !== cicloAtivo.nome) {
            updateCiclo(cicloAtivo.id, { nome: editedCicloName.trim() });
            toast.success("Nome do ciclo atualizado.");
        }
        setIsEditingCiclo(false);
    }
    
    const handleRemoveCiclo = () => {
        if (cicloAtivo && window.confirm(`Tem certeza que deseja remover o ciclo "${cicloAtivo.nome}"?`)) {
            removeCiclo(cicloAtivo.id);
            toast.success("Ciclo removido.");
        }
    }
    
    const handleAddSessao = async () => {
        if (cicloAtivo && novaSessaoData.disciplinaId && parseInt(novaSessaoData.tempoMinutos) > 0) {
            await addSessaoAoCiclo(cicloAtivo.id, novaSessaoData.disciplinaId, parseInt(novaSessaoData.tempoMinutos) * 60);
            toast.success("Sessão adicionada ao ciclo.");
            setNovaSessaoData({ disciplinaId: '', tempoMinutos: '60' });
            setIsAddingSessao(false);
        } else {
            toast.error("Selecione uma disciplina e defina um tempo válido.");
        }
    };
    
    const handleIniciarEstudoCiclo = (sessao: SessaoCiclo) => {
        const disciplina = disciplinas.find(d => d.id === sessao.disciplina_id);
        if (disciplina && cicloAtivo) {
            iniciarSessao({
                id: `ciclo-${sessao.id}`, // ID sintético para rastreamento
                nome: disciplina.nome,
                disciplinaId: disciplina.id
            });
            toast.success(`Iniciando estudos de ${disciplina.nome}!`);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><RepeatIcon className="w-8 h-8"/> Ciclos de Estudos</h1>
                    <p className="text-muted-foreground mt-1">Organize suas disciplinas em um ciclo rotativo para garantir um estudo equilibrado.</p>
                </div>
                <button onClick={openCriarCicloModal} className="h-10 px-4 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <PlusCircleIcon className="w-4 h-4" />
                    Criar Novo Ciclo
                </button>
            </header>

            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <label htmlFor="ciclo-select" className="text-sm font-medium text-muted-foreground mb-1 block">Ciclo Ativo</label>
                <select
                    id="ciclo-select"
                    value={cicloAtivoId || ''}
                    onChange={(e) => setCicloAtivoId(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                >
                    {ciclos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
            </div>

            {cicloAtivo ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm">
                        <header className="p-4 border-b border-border flex items-center justify-between">
                            {isEditingCiclo ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        value={editedCicloName}
                                        onChange={(e) => setEditedCicloName(e.target.value)}
                                        className="bg-muted/50 border border-border rounded-md px-3 py-1.5 text-lg font-bold"
                                        autoFocus
                                        onBlur={handleUpdateCicloName}
                                        onKeyDown={e => e.key === 'Enter' && handleUpdateCicloName()}
                                    />
                                    <button onClick={handleUpdateCicloName} className="p-2 rounded-md hover:bg-muted"><SaveIcon className="w-4 h-4 text-primary"/></button>
                                </div>
                            ) : (
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    {cicloAtivo.nome}
                                    <button onClick={() => { setIsEditingCiclo(true); setEditedCicloName(cicloAtivo.nome); }} className="p-1.5 text-muted-foreground hover:text-primary"><EditIcon className="w-4 h-4"/></button>
                                </h2>
                            )}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="font-bold text-foreground">{formatTime(totalTempoCiclo)}</p>
                                    <p className="text-xs text-muted-foreground">Tempo total</p>
                                </div>
                                <button onClick={handleRemoveCiclo} className="p-2 text-muted-foreground hover:text-red-500"><Trash2Icon className="w-4 h-4"/></button>
                            </div>
                        </header>
                        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                            {(cicloAtivo.sessoes || []).map((sessao, index) => {
                                const isNext = sessao.id === proximaSessao?.id;
                                return (
                                <div key={sessao.id} className={`p-4 flex items-center justify-between group transition-colors ${isNext ? 'bg-primary/10 border-l-4 border-primary' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold bg-muted/50 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground">{index + 1}</span>
                                        <div>
                                            <p className="font-semibold text-foreground">{disciplinasMap.get(sessao.disciplina_id) || 'Disciplina não encontrada'}</p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1"><ClockIcon className="w-3 h-3"/> {formatTime(sessao.tempo_previsto)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                         {isNext ? (
                                            <button onClick={() => handleIniciarEstudoCiclo(sessao)} className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-primary text-black text-xs font-bold shadow-sm hover:opacity-90">
                                                <PlayIcon className="w-3 h-3"/> Iniciar Estudo
                                            </button>
                                        ) : (
                                            <button onClick={() => handleIniciarEstudoCiclo(sessao)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground text-xs font-bold shadow-sm hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                                <PlayIcon className="w-3 h-3"/>
                                            </button>
                                        )}
                                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => reordenarSessao(cicloAtivo.id, sessao.id, 'up')} disabled={index === 0} className="p-1 rounded-md hover:bg-background disabled:opacity-30"><ArrowUpIcon className="w-3 h-3"/></button>
                                            <button onClick={() => reordenarSessao(cicloAtivo.id, sessao.id, 'down')} disabled={index === (cicloAtivo.sessoes || []).length - 1} className="p-1 rounded-md hover:bg-background disabled:opacity-30"><ArrowDownIcon className="w-3 h-3"/></button>
                                        </div>
                                        <button onClick={() => removeSessaoDoCiclo(cicloAtivo.id, sessao.id)} className="p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2Icon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            )})}
                            
                            {isAddingSessao && (
                                <div className="p-4 bg-muted/20 flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Disciplina</label>
                                        <select
                                            value={novaSessaoData.disciplinaId}
                                            onChange={e => setNovaSessaoData({...novaSessaoData, disciplinaId: e.target.value})}
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                                        >
                                            <option value="">Selecione...</option>
                                            {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Tempo (min)</label>
                                        <input
                                            type="number"
                                            value={novaSessaoData.tempoMinutos}
                                            onChange={e => setNovaSessaoData({...novaSessaoData, tempoMinutos: e.target.value})}
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <button onClick={handleAddSessao} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm">Adicionar</button>
                                    <button onClick={() => setIsAddingSessao(false)} className="h-10 w-10 rounded-lg border border-border text-muted-foreground hover:bg-muted"><XIcon className="w-4 h-4 mx-auto"/></button>
                                </div>
                            )}
                        </div>
                        {!isAddingSessao && (
                            <div className="p-4 border-t border-border">
                                <button onClick={() => setIsAddingSessao(true)} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-primary font-medium text-sm hover:bg-primary/10">
                                    <PlusIcon className="w-4 h-4"/> Adicionar Sessão de Estudo
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="bg-card rounded-xl border border-border shadow-sm p-4 space-y-4">
                        <h3 className="font-bold text-center text-foreground">Distribuição do Tempo</h3>
                        {dadosGrafico.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={dadosGrafico} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                                        {dadosGrafico.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)'}} formatter={(value: number) => `${value} min`}/>
                                    <Legend iconSize={10} wrapperStyle={{fontSize: '0.8rem', paddingTop: '10px'}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Adicione sessões para ver o gráfico.</div>
                        )}
                        {proximaSessao && (
                             <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                                <p className="text-xs font-bold text-primary mb-1">PRÓXIMA SESSÃO</p>
                                <p className="font-semibold text-lg text-foreground">{disciplinasMap.get(proximaSessao.disciplina_id)}</p>
                                <p className="text-sm text-muted-foreground">{formatTime(proximaSessao.tempo_previsto)}</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-24 bg-card rounded-xl border-2 border-dashed border-border">
                    <RepeatIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">Nenhum ciclo de estudos criado</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Comece a organizar seus estudos de forma mais eficiente.</p>
                    <button onClick={openCriarCicloModal} className="h-11 px-6 flex items-center mx-auto gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                        <PlusCircleIcon className="w-5 h-5" />
                        Criar meu primeiro ciclo
                    </button>
                </div>
            )}
        </div>
    );
};

export default CicloDeEstudos;
