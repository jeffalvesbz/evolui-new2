import React, { useState, useMemo } from 'react';
import { useCiclosStore } from '../stores/useCiclosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { RepeatIcon, PlusIcon, EditIcon, Trash2Icon, SaveIcon, XIcon, ClockIcon, PlusCircleIcon } from './icons';
import { toast } from './Sonner';
import { useModalStore } from '../stores/useModalStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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
    } = useCiclosStore();
    const { disciplinas } = useDisciplinasStore();
    const openCriarCicloModal = useModalStore(state => state.openCriarCicloModal);
    
    const [isEditingCiclo, setIsEditingCiclo] = useState(false);
    const [editedCicloName, setEditedCicloName] = useState('');
    const [isAddingSessao, setIsAddingSessao] = useState(false);
    const [novaSessaoData, setNovaSessaoData] = useState({ disciplinaId: '', tempoMinutos: '60' });

    const cicloAtivo = useMemo(() => getCicloAtivo(), [cicloAtivoId, ciclos, getCicloAtivo]);

    const disciplinasMap = useMemo(() => new Map(disciplinas.map(d => [d.id, d.nome])), [disciplinas]);

    const { totalTempoCiclo, dadosGrafico } = useMemo(() => {
        if (!cicloAtivo) return { totalTempoCiclo: 0, dadosGrafico: [] };
        
        const tempoTotal = cicloAtivo.sessoes.reduce((acc, s) => acc + s.tempo_previsto, 0);
        
        const tempoPorDisciplina = cicloAtivo.sessoes.reduce((acc, sessao) => {
          const nomeDisciplina = disciplinasMap.get(sessao.disciplina_id) || 'Desconhecida';
          acc[nomeDisciplina] = (acc[nomeDisciplina] || 0) + sessao.tempo_previsto;
          return acc;
        }, {} as Record<string, number>);

        const graficoData = Object.entries(tempoPorDisciplina).map(([name, value]) => ({
            name,
            value: Math.round(value / 60), // em minutos
        }));

        return { totalTempoCiclo: tempoTotal, dadosGrafico: graficoData };
    }, [cicloAtivo, disciplinasMap]);
    
    const handleUpdateCicloName = () => {
        if (cicloAtivo && editedCicloName.trim() && editedCicloName.trim() !== cicloAtivo.nome) {
            updateCiclo(cicloAtivo.id, editedCicloName.trim());
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
    
    const handleAddSessao = () => {
        if (cicloAtivo && novaSessaoData.disciplinaId && parseInt(novaSessaoData.tempoMinutos) > 0) {
            addSessaoAoCiclo(cicloAtivo.id, novaSessaoData.disciplinaId, parseInt(novaSessaoData.tempoMinutos) * 60);
            toast.success("Sessão adicionada ao ciclo.");
            setNovaSessaoData({ disciplinaId: '', tempoMinutos: '60' });
            setIsAddingSessao(false);
        } else {
            toast.error("Selecione uma disciplina e defina um tempo válido.");
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
                            {cicloAtivo.sessoes.map((sessao, index) => (
                                <div key={sessao.id} className="p-4 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold bg-muted/50 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground">{index + 1}</span>
                                        <div>
                                            <p className="font-semibold text-foreground">{disciplinasMap.get(sessao.disciplina_id) || 'Disciplina não encontrada'}</p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1"><ClockIcon className="w-3 h-3"/> {formatTime(sessao.tempo_previsto)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removeSessaoDoCiclo(cicloAtivo.id, sessao.id)} className="p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2Icon className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                            
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
                    <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                        <h3 className="font-bold text-center mb-2 text-foreground">Distribuição do Tempo</h3>
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