import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { PencilRulerIcon, SparklesIcon, CameraIcon, HistoryIcon, AlertTriangleIcon } from './icons';
import { corrigirRedacao, extrairTextoDeImagem } from '../services/geminiService';
import { toast } from './Sonner';
import { CorrecaoCompleta, CorrecaoErroDetalhado, RedacaoCorrigida, NotasPesosEntrada } from '../types';
import { useRedacaoStore } from '../stores/useRedacaoStore';

// --- Helper Functions & Types ---
type ActiveTab = 'corrigir' | 'historico';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- Sub-components ---

const ErrorTooltip: React.FC<{ erro: CorrecaoErroDetalhado }> = ({ erro }) => (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-card rounded-lg border border-red-500/50 shadow-2xl z-20 pointer-events-none">
        <h4 className="font-bold text-sm text-foreground mb-1">{erro.tipo}</h4>
        <p className="text-xs text-muted-foreground mb-2">{erro.explicacao}</p>
        <p className="text-xs text-primary font-semibold border-t border-border pt-1">Sugestão: <span className="font-normal">{erro.sugestao}</span></p>
    </div>
);

const renderRedacaoComErros = (texto: string, erros: CorrecaoErroDetalhado[]) => {
    if (!erros || erros.length === 0) {
        return <p className="whitespace-pre-wrap text-sm leading-relaxed">{texto}</p>;
    }
    const regex = new RegExp(`(${erros.map(e => e.trecho.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    const parts = texto.split(regex).filter(Boolean);

    return (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {parts.map((part, index) => {
                const erro = erros.find(e => e.trecho === part);
                if (erro) {
                    return (
                        <span key={index} className="relative group inline-block">
                            <span className="bg-red-500/20 underline decoration-red-500 decoration-wavy decoration-from-font underline-offset-2 cursor-pointer transition-colors hover:bg-red-500/30">
                                {part}
                            </span>
                           <ErrorTooltip erro={erro} />
                        </span>
                    );
                }
                return part;
            })}
        </p>
    );
};


const AvaliacaoDetalhada: React.FC<{ correcao: CorrecaoCompleta; tema?: string; }> = ({ correcao, tema }) => (
    <div className="space-y-6">
        {tema && (
             <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-1">Tema Avaliado</h3>
                <p className="text-xs p-2 bg-muted/30 rounded-md">{tema}</p>
            </div>
        )}
        
        {correcao.avaliacaoGeral && (
            <div>
                <h3 className="text-lg font-bold text-foreground mb-2">📊 Avaliação Geral</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{correcao.avaliacaoGeral}</p>
            </div>
        )}
        
        <div>
            <h3 className="text-lg font-bold text-foreground mb-2">📋 Análise por Critério</h3>
            <div className="space-y-4">
                {correcao.avaliacaoDetalhada.map((item, i) => (
                    <div key={i} className="p-3 bg-muted/30 rounded-lg border border-border">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold text-sm text-foreground">{item.criterio.split(':')[0]}</h4>
                            <div className="flex items-center gap-2">
                                {item.peso && (
                                    <span className="text-xs text-muted-foreground">Peso: {(item.peso * 100).toFixed(0)}%</span>
                                )}
                                <span className="font-bold text-sm text-primary">{item.pontuacao.toFixed(1)} / {item.maximo.toFixed(1)}</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{item.feedback}</p>
                    </div>
                ))}
            </div>
        </div>
        
        {correcao.textoCorrigido && (
            <div>
                <h3 className="text-lg font-bold text-foreground mb-2">📝 Texto Corrigido</h3>
                <div className="p-4 bg-muted/30 rounded-lg border border-border max-h-[400px] overflow-y-auto">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{correcao.textoCorrigido}</p>
                </div>
            </div>
        )}
        
        <div>
            <h3 className="text-lg font-bold text-foreground mb-2">Comentários Gerais</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{correcao.comentariosGerais}</p>
        </div>
        
        {correcao.sinteseFinal && (
            <div>
                <h3 className="text-lg font-bold text-foreground mb-2">💡 Síntese Final (Feedback Pedagógico)</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{correcao.sinteseFinal}</p>
            </div>
        )}
        
        <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Nota Final</p>
            <p className="text-5xl font-bold text-primary">{correcao.notaFinal.toFixed(1)} / {correcao.notaMaxima}</p>
        </div>
    </div>
);


const HistoricoProgresso: React.FC = () => {
    const historico = useRedacaoStore(state => state.historico);
    const [selectedCorrecao, setSelectedCorrecao] = useState<RedacaoCorrigida | null>(null);
    const [bancaFiltro, setBancaFiltro] = useState<string>('todas');

    const bancasDisponiveis = useMemo(() => {
        const bancas = new Set(historico.map(h => h.banca));
        return ['todas', ...Array.from(bancas)];
    }, [historico]);

    // Helper para filtrar histórico por banca
    const historicoFiltrado = useMemo(() => {
        return bancaFiltro === 'todas'
            ? historico
            : historico.filter(h => h.banca === bancaFiltro);
    }, [historico, bancaFiltro]);

    const evolutionData = useMemo(() => historicoFiltrado
        .map(h => ({
            data: new Date(h.data).toLocaleDateString('pt-br'),
            nota: h.correcao.notaFinal,
            notaMaxima: h.correcao.notaMaxima,
            notaPercentual: (h.correcao.notaFinal / h.correcao.notaMaxima) * 100
        }))
        .sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime()), [historicoFiltrado]);

    const criteriaData = useMemo(() => {
        const criteriaMap = new Map<string, { total: number, count: number }>();
        historicoFiltrado.forEach(h => {
            h.correcao.avaliacaoDetalhada.forEach(c => {
                const key = c.criterio.split(':')[0];
                const current = criteriaMap.get(key) || { total: 0, count: 0 };
                const scorePercent = c.maximo > 0 ? (c.pontuacao / c.maximo) * 100 : 0;
                current.total += scorePercent;
                current.count++;
                criteriaMap.set(key, current);
            });
        });
        return Array.from(criteriaMap.entries()).map(([name, { total, count }]) => ({
            name,
            media: parseFloat((total / count).toFixed(1))
        }));
    }, [historicoFiltrado]);
    
     const errorTypesData = useMemo(() => {
        const errorMap = new Map<string, number>();
        historicoFiltrado.forEach(h => {
            h.correcao.errosDetalhados.forEach(e => {
                errorMap.set(e.tipo, (errorMap.get(e.tipo) || 0) + 1);
            });
        });
        return Array.from(errorMap.entries()).map(([name, value]) => ({ name, value }));
    }, [historicoFiltrado]);

    const COLORS = ['#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#3b82f6'];

    if (historico.length === 0) {
        return <div className="text-center py-24 bg-card rounded-xl border-2 border-dashed border-border">
            <HistoryIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Sem Histórico</h3>
            <p className="text-muted-foreground mt-2">Corrija sua primeira redação para começar a acompanhar seu progresso.</p>
        </div>;
    }
    
    return (
        <div className="space-y-8">
            {/* Filtro de Banca Global */}
            {bancasDisponiveis.length > 2 && (
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-foreground">Filtrar por Banca:</label>
                        <select
                            value={bancaFiltro}
                            onChange={(e) => setBancaFiltro(e.target.value)}
                            className="bg-muted/50 border border-border rounded-md px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            aria-label="Filtrar por banca"
                        >
                            {bancasDisponiveis.map(b => (
                                <option key={b} value={b}>{b === 'todas' ? 'Todas as Bancas' : b}</option>
                            ))}
                        </select>
                        {bancaFiltro !== 'todas' && (
                            <span className="text-xs text-muted-foreground">
                                ({historicoFiltrado.length} {historicoFiltrado.length === 1 ? 'redação' : 'redações'})
                            </span>
                        )}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-foreground">Evolução das Notas</h3>
                        {bancaFiltro !== 'todas' && (
                            <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                                {bancaFiltro}
                            </span>
                        )}
                     </div>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={evolutionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="data" stroke="var(--color-muted-foreground)" fontSize={12} />
                            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={[0, 100]} unit="%"/>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} formatter={(value, name, props) => [`${props.payload.nota} / ${props.payload.notaMaxima}`, 'Nota']} />
                            <Line type="monotone" dataKey="notaPercentual" stroke="var(--color-primary)" strokeWidth={2} />
                        </LineChart>
                     </ResponsiveContainer>
                </div>
                 <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-foreground">Média por Critério</h3>
                        {bancaFiltro !== 'todas' && (
                            <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                                {bancaFiltro}
                            </span>
                        )}
                    </div>
                     <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={criteriaData} layout="vertical" margin={{ left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis type="number" domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={12} unit="%"/>
                            <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" width={80} fontSize={12} interval={0} tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} cursor={{fill: 'rgba(16, 185, 129, 0.1)'}}/>
                            <Bar dataKey="media" fill="var(--color-secondary)" radius={[0, 4, 4, 0]} barSize={20}/>
                        </BarChart>
                     </ResponsiveContainer>
                </div>
                <div className="bg-card rounded-xl border border-border p-6 lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-foreground">Tipos de Erros Frequentes</h3>
                        {bancaFiltro !== 'todas' && (
                            <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                                {bancaFiltro}
                            </span>
                        )}
                    </div>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={errorTypesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                                {errorTypesData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} />
                            <Legend iconSize={10}/>
                        </PieChart>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const CorretorRedacao: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('corrigir');
    const [banca, setBanca] = useState('Enem');
    const [notaMaxima, setNotaMaxima] = useState(1000);
    const [redacao, setRedacao] = useState('');
    const [tema, setTema] = useState('');
    const [correcao, setCorrecao] = useState<CorrecaoCompleta | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [usarAvaliacaoManual, setUsarAvaliacaoManual] = useState(false);
    const [notasPesos, setNotasPesos] = useState<NotasPesosEntrada>({});
    const [observacaoAvaliador, setObservacaoAvaliador] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { addCorrecao, historico } = useRedacaoStore();
    
    // Constante para limite de redações por mês
    const LIMITE_REDACOES_MES = 10;
    
    // Função para contar redações do mês atual
    const redacoesNoMes = useMemo(() => {
        const agora = new Date();
        const mesAtual = agora.getMonth();
        const anoAtual = agora.getFullYear();
        
        return historico.filter(h => {
            const dataRedacao = new Date(h.data);
            return dataRedacao.getMonth() === mesAtual && dataRedacao.getFullYear() === anoAtual;
        }).length;
    }, [historico]);
    
    const redacoesRestantes = LIMITE_REDACOES_MES - redacoesNoMes;

    useEffect(() => {
        setBanca('Enem');
        setNotaMaxima(1000);
        setRedacao('');
        setTema('');
        setCorrecao(null);
    }, [activeTab]);

    useEffect(() => {
        if (banca === 'Enem') setNotaMaxima(1000);
        else setNotaMaxima(30);
    }, [banca]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsOcrLoading(true);
        toast("Extraindo texto da imagem...");
        try {
            const base64Data = await blobToBase64(file);
            const textoExtraido = await extrairTextoDeImagem(base64Data, file.type);
            setRedacao(textoExtraido);
            toast.success("Texto extraído com sucesso!");
        } catch (error) {
            toast.error("Falha ao extrair texto da imagem.");
            console.error("OCR Error:", error);
        } finally {
            setIsOcrLoading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validar limite de redações por mês
        if (redacoesNoMes >= LIMITE_REDACOES_MES) {
            toast.error(`Limite de ${LIMITE_REDACOES_MES} redações por mês atingido! O limite será resetado no próximo mês.`);
            return;
        }
        
        if (redacao.trim().length < 50) {
            toast.error("Por favor, insira um texto com pelo menos 50 caracteres.");
            return;
        }
        
        // Validar pesos se avaliação manual estiver ativa
        if (usarAvaliacaoManual) {
            const pesos = [
                notasPesos.conteudo?.peso || 0,
                notasPesos.estrutura?.peso || 0,
                notasPesos.linguagem?.peso || 0,
                notasPesos.argumentacao?.peso || 0,
                notasPesos.coesao?.peso || 0
            ].filter(p => p > 0);
            
            const somaPesos = pesos.reduce((sum, p) => sum + p, 0);
            if (Math.abs(somaPesos - 1.0) > 0.01) {
                toast.error(`A soma dos pesos deve ser 1.0 (atual: ${somaPesos.toFixed(2)})`);
                return;
            }
        }
        
        setIsLoading(true);
        setCorrecao(null);
        try {
            const notasPesosComObservacao = usarAvaliacaoManual 
                ? { ...notasPesos, observacaoAvaliador: observacaoAvaliador || undefined }
                : undefined;
            
            // Normalizar CESPE para Cebraspe (mesma banca)
            const bancaNormalizada = (banca === 'CESPE' || banca === 'Cebraspe') ? 'Cebraspe' : banca;
            
            const result = await corrigirRedacao(redacao, bancaNormalizada, notaMaxima, tema, notasPesosComObservacao);
            setCorrecao(result);
            addCorrecao({ texto: redacao, banca: bancaNormalizada, notaMaxima, correcao: result, tema });
            toast.success("Redação corrigida com sucesso!");
        } catch (error) {
            toast.error("Ocorreu um erro ao processar a correção.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const TabButton: React.FC<{label: string, icon: React.ElementType, active: boolean, onClick: () => void;}> = ({label, icon: Icon, active, onClick}) => (
        <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 p-3 border-b-2 font-semibold transition-all ${active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}>
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div data-tutorial="corretor-content" className="space-y-6">
            <style>{`.tooltip-container:hover .tooltip-content { opacity: 1; }`}</style>
            <header>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><PencilRulerIcon className="w-8 h-8"/> Corretor de Redação IA</h1>
                <p className="text-muted-foreground mt-1">Receba uma análise detalhada da sua redação e acompanhe seu progresso.</p>
            </header>
            
            <div className="border-b border-border flex">
                <TabButton label="Corrigir Redação" icon={PencilRulerIcon} active={activeTab === 'corrigir'} onClick={() => setActiveTab('corrigir')} />
                <TabButton label="Histórico e Progresso" icon={HistoryIcon} active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} />
            </div>

            <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 'corrigir' ? (
                <div className="space-y-8">
                    {/* Aviso de Limite de Redações */}
                    {redacoesNoMes >= LIMITE_REDACOES_MES ? (
                        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 flex items-center gap-3">
                            <AlertTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold text-red-500">Limite de {LIMITE_REDACOES_MES} redações por mês atingido!</p>
                                <p className="text-sm text-muted-foreground mt-1">O limite será resetado automaticamente no próximo mês.</p>
                            </div>
                        </div>
                    ) : redacoesRestantes <= 3 ? (
                        <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl p-4 flex items-center gap-3">
                            <AlertTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold text-yellow-500">Atenção: {redacoesRestantes} {redacoesRestantes === 1 ? 'redação restante' : 'redações restantes'} este mês</p>
                                <p className="text-sm text-muted-foreground mt-1">Você já corrigiu {redacoesNoMes} de {LIMITE_REDACOES_MES} redações permitidas este mês.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">
                                    Redações este mês: <span className="font-bold text-primary">{redacoesNoMes}</span> / {LIMITE_REDACOES_MES} 
                                    {' '}({redacoesRestantes} {redacoesRestantes === 1 ? 'restante' : 'restantes'})
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Form Section */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="tema" className="block text-sm font-medium text-muted-foreground mb-1">Tema / Tópicos da Redação (Opcional)</label>
                                <textarea id="tema" value={tema} onChange={(e) => setTema(e.target.value)} rows={3} className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary placeholder:text-muted-foreground" placeholder="Cole o tema da redação ou os textos de apoio aqui para uma correção mais precisa..."/>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="redacao" className="block text-sm font-medium text-muted-foreground">Texto da Redação *</label>
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden"/>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isOcrLoading} className="px-2 py-1 flex items-center gap-1.5 rounded-md bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 disabled:opacity-50">
                                        <CameraIcon className="w-4 h-4" /> {isOcrLoading ? 'Lendo...' : 'Enviar Foto'}
                                    </button>
                                </div>
                                <textarea id="redacao" value={redacao} onChange={(e) => setRedacao(e.target.value)} rows={12} className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary placeholder:text-muted-foreground" placeholder="Cole sua redação aqui ou envie uma foto..."/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="banca" className="block text-sm font-medium text-muted-foreground mb-1">Banca</label>
                                    <select id="banca" value={banca} onChange={e => setBanca(e.target.value)} className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground">
                                        <option>Enem</option>
                                        <option>Cebraspe</option>
                                        <option>FGV</option>
                                        <option>FCC</option>
                                        <option>VUNESP</option>
                                        <option>IBFC</option>
                                        <option>QUADRIX</option>
                                        <option>IDECAN</option>
                                        <option>AOCP</option>
                                        <option>CESGRANRIO</option>
                                        <option>Outras</option>
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="notaMaxima" className="block text-sm font-medium text-muted-foreground mb-1">Nota Máxima</label>
                                    <input type="number" id="notaMaxima" value={notaMaxima} onChange={e => setNotaMaxima(Number(e.target.value))} disabled={banca === 'Enem'} className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground disabled:opacity-50"/>
                                </div>
                            </div>
                            
                            {/* Avaliação Manual (Opcional) */}
                            <div className="border-t border-border pt-4">
                                <label className="flex items-center gap-2 cursor-pointer mb-3">
                                    <input 
                                        type="checkbox" 
                                        checked={usarAvaliacaoManual}
                                        onChange={(e) => setUsarAvaliacaoManual(e.target.checked)}
                                        className="w-4 h-4 rounded border-border"
                                    />
                                    <span className="text-sm font-medium text-foreground">Definir notas e pesos manualmente (IA irá interpretar e explicar)</span>
                                </label>
                                
                                {usarAvaliacaoManual && (
                                    <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                                        <p className="text-xs text-muted-foreground mb-3">
                                            Defina as notas e pesos para cada critério. A IA irá interpretar e explicar essas notas, não calculá-las.
                                        </p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {['conteudo', 'estrutura', 'linguagem'].map((criterio) => {
                                                const key = criterio as keyof NotasPesosEntrada;
                                                const maximo = notaMaxima * (key === 'conteudo' ? 0.4 : key === 'estrutura' ? 0.3 : 0.3);
                                                return (
                                                    <div key={criterio} className="space-y-2">
                                                        <label className="block text-xs font-medium text-foreground capitalize">
                                                            {criterio === 'conteudo' ? 'Conteúdo' : criterio === 'estrutura' ? 'Estrutura' : 'Linguagem'}
                                                        </label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                placeholder="Nota"
                                                                value={notasPesos[key]?.nota || ''}
                                                                onChange={(e) => setNotasPesos({
                                                                    ...notasPesos,
                                                                    [key]: {
                                                                        nota: Number(e.target.value),
                                                                        peso: notasPesos[key]?.peso || (key === 'conteudo' ? 0.4 : key === 'estrutura' ? 0.3 : 0.3),
                                                                        maximo: maximo
                                                                    }
                                                                })}
                                                                className="w-full bg-card border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
                                                            />
                                                            <input
                                                                type="number"
                                                                step="0.05"
                                                                placeholder="Peso"
                                                                value={notasPesos[key]?.peso || ''}
                                                                onChange={(e) => setNotasPesos({
                                                                    ...notasPesos,
                                                                    [key]: {
                                                                        nota: notasPesos[key]?.nota || 0,
                                                                        peso: Number(e.target.value),
                                                                        maximo: maximo
                                                                    }
                                                                })}
                                                                className="w-full bg-card border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">Máx: {maximo.toFixed(1)}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-medium text-foreground mb-1">Observação do Avaliador (Opcional)</label>
                                            <textarea
                                                value={observacaoAvaliador}
                                                onChange={(e) => setObservacaoAvaliador(e.target.value)}
                                                rows={2}
                                                className="w-full bg-card border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground"
                                                placeholder="Comentários gerais sobre a redação..."
                                            />
                                        </div>
                                        
                                        <div className="text-xs text-muted-foreground">
                                            Soma dos pesos: {(
                                                (notasPesos.conteudo?.peso || 0) +
                                                (notasPesos.estrutura?.peso || 0) +
                                                (notasPesos.linguagem?.peso || 0) +
                                                (notasPesos.argumentacao?.peso || 0) +
                                                (notasPesos.coesao?.peso || 0)
                                            ).toFixed(2)} (deve ser 1.0)
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button type="submit" disabled={isLoading || isOcrLoading || redacoesNoMes >= LIMITE_REDACOES_MES} className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                                <SparklesIcon className="w-5 h-5"/>
                                {isLoading ? 'Corrigindo...' : 'Corrigir com IA'}
                            </button>
                        </form>
                    </div>

                    {/* Result Section */}
                    <AnimatePresence>
                        {(isLoading || isOcrLoading || correcao) && (
                            <motion.div
                                key="results-section"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="bg-card rounded-xl border border-border min-h-[500px] flex flex-col">
                                    <AnimatePresence mode="wait">
                                        {isLoading || isOcrLoading ? (
                                            <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center justify-center flex-1 text-center p-4">
                                                <SparklesIcon className="w-12 h-12 text-primary animate-pulse mb-4" />
                                                <h3 className="font-semibold text-lg text-foreground">{isOcrLoading ? 'Analisando imagem...' : 'Analisando sua redação...'}</h3>
                                                <p className="text-muted-foreground mt-1">{isOcrLoading ? 'Aguarde enquanto a IA extrai o texto.' : 'A IA está avaliando cada critério.'}</p>
                                            </motion.div>
                                        ) : correcao ? (
                                            <motion.div key="result" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-6 space-y-8">
                                                <div className="space-y-4">
                                                    <h3 className="text-xl font-bold text-foreground">Texto Corrigido</h3>
                                                    <div className="p-4 bg-muted/30 rounded-lg border border-border max-h-[400px] overflow-y-auto">{renderRedacaoComErros(redacao, correcao.errosDetalhados)}</div>
                                                </div>
                                                <div className="border-t pt-8 mt-8 border-border"><AvaliacaoDetalhada correcao={correcao} tema={tema} /></div>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <HistoricoProgresso />
            )}
            </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default CorretorRedacao;