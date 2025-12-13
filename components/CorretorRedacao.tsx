import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Legend, CartesianGrid } from 'recharts';
import { PencilRulerIcon, SparklesIcon, CameraIcon, HistoryIcon, AlertTriangleIcon, Trash2Icon } from './icons';
import { corrigirRedacao, extrairTextoDeImagem } from '../services/geminiService';
import { toast } from './Sonner';
import { CorrecaoCompleta, CorrecaoErroDetalhado, RedacaoCorrigida, NotasPesosEntrada } from '../types';
import { useRedacaoStore } from '../stores/useRedacaoStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useEditalStore } from '../stores/useEditalStore';

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

// --- Função de Diff Visual ---
type DiffPart = {
    type: 'equal' | 'removed' | 'added';
    text: string;
};

/**
 * Calcula a maior subsequência comum entre dois arrays de palavras
 */
const computeLCS = (words1: string[], words2: string[]): string[] => {
    const m = words1.length;
    const n = words2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (words1[i - 1].toLowerCase() === words2[j - 1].toLowerCase()) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Reconstruir a LCS
    const lcs: string[] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
        if (words1[i - 1].toLowerCase() === words2[j - 1].toLowerCase()) {
            lcs.unshift(words1[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    return lcs;
};

/**
 * Compara texto original com texto corrigido e retorna partes com marcação de diff
 */
const computeWordDiff = (original: string, corrected: string): DiffPart[] => {
    // Tokenizar mantendo pontuação
    const tokenize = (text: string): string[] => {
        return text.split(/(\s+)/).filter(t => t.length > 0);
    };

    const origWords = tokenize(original);
    const corrWords = tokenize(corrected);

    // Se textos são muito grandes, fazer diff simplificado por parágrafos
    if (origWords.length > 500 || corrWords.length > 500) {
        // Retornar apenas o texto corrigido sem diff detalhado
        return [{ type: 'equal', text: corrected }];
    }

    const lcs = computeLCS(origWords, corrWords);
    const result: DiffPart[] = [];

    let origIdx = 0;
    let corrIdx = 0;
    let lcsIdx = 0;

    while (origIdx < origWords.length || corrIdx < corrWords.length) {
        // Coletar palavras removidas (no original mas não na LCS)
        const removed: string[] = [];
        while (origIdx < origWords.length &&
            (lcsIdx >= lcs.length || origWords[origIdx].toLowerCase() !== lcs[lcsIdx].toLowerCase())) {
            removed.push(origWords[origIdx]);
            origIdx++;
        }

        // Coletar palavras adicionadas (no corrigido mas não na LCS)
        const added: string[] = [];
        while (corrIdx < corrWords.length &&
            (lcsIdx >= lcs.length || corrWords[corrIdx].toLowerCase() !== lcs[lcsIdx].toLowerCase())) {
            added.push(corrWords[corrIdx]);
            corrIdx++;
        }

        // Adicionar partes removidas
        if (removed.length > 0) {
            result.push({ type: 'removed', text: removed.join('') });
        }

        // Adicionar partes adicionadas
        if (added.length > 0) {
            result.push({ type: 'added', text: added.join('') });
        }

        // Adicionar palavra comum
        if (lcsIdx < lcs.length && origIdx < origWords.length && corrIdx < corrWords.length) {
            result.push({ type: 'equal', text: corrWords[corrIdx] });
            origIdx++;
            corrIdx++;
            lcsIdx++;
        }
    }

    // Consolidar partes adjacentes do mesmo tipo
    const consolidated: DiffPart[] = [];
    for (const part of result) {
        if (consolidated.length > 0 && consolidated[consolidated.length - 1].type === part.type) {
            consolidated[consolidated.length - 1].text += part.text;
        } else {
            consolidated.push({ ...part });
        }
    }

    return consolidated;
};

// --- Sub-components ---


const ErrorTooltip: React.FC<{ erro: CorrecaoErroDetalhado }> = ({ erro }) => {
    // Determinar gravidade baseada no tipo de erro
    const getGravidade = (tipo: string): 'leve' | 'moderado' | 'grave' => {
        const tipoLower = tipo.toLowerCase();
        if (tipoLower.includes('ortográfico') || tipoLower.includes('acentuação')) return 'leve';
        if (tipoLower.includes('coerência') || tipoLower.includes('estrutura') || tipoLower.includes('argumentação')) return 'grave';
        return 'moderado';
    };

    const gravidade = getGravidade(erro.tipo);
    const gravidadeColors = {
        leve: 'border-yellow-500/50 bg-yellow-500/5',
        moderado: 'border-orange-500/50 bg-orange-500/5',
        grave: 'border-red-500/50 bg-red-500/5'
    };

    return (
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-4 bg-card rounded-lg border-2 ${gravidadeColors[gravidade]} shadow-2xl z-20 pointer-events-none transition-all duration-200`}>
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-sm text-foreground flex-1">{erro.tipo}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${gravidade === 'grave' ? 'bg-red-500/20 text-red-500' :
                    gravidade === 'moderado' ? 'bg-orange-500/20 text-orange-500' :
                        'bg-yellow-500/20 text-yellow-500'
                    }`}>
                    {gravidade === 'grave' ? 'Grave' : gravidade === 'moderado' ? 'Moderado' : 'Leve'}
                </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{erro.explicacao}</p>
            <div className="border-t border-border pt-2">
                <p className="text-xs font-semibold text-primary mb-1">💡 Sugestão de correção:</p>
                <p className="text-xs text-foreground bg-muted/30 p-2 rounded border border-border leading-relaxed">{erro.sugestao}</p>
            </div>
        </div>
    );
};

const renderRedacaoComErros = (texto: string, erros: CorrecaoErroDetalhado[]) => {
    if (!erros || erros.length === 0) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold">Nenhum erro encontrado! Parabéns!</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{texto}</p>
            </div>
        );
    }

    // Ordenar erros por posição no texto (aproximado)
    const errosOrdenados = [...erros].sort((a, b) => {
        const posA = texto.indexOf(a.trecho);
        const posB = texto.indexOf(b.trecho);
        return posA - posB;
    });

    // Criar uma lista de spans com erros destacados
    let lastIndex = 0;
    const parts: Array<{ text: string; erro?: CorrecaoErroDetalhado; isError: boolean }> = [];

    errosOrdenados.forEach((erro) => {
        const index = texto.indexOf(erro.trecho, lastIndex);
        if (index !== -1) {
            // Adicionar texto antes do erro
            if (index > lastIndex) {
                parts.push({ text: texto.substring(lastIndex, index), isError: false });
            }
            // Adicionar o erro
            parts.push({ text: erro.trecho, erro, isError: true });
            lastIndex = index + erro.trecho.length;
        }
    });

    // Adicionar texto restante
    if (lastIndex < texto.length) {
        parts.push({ text: texto.substring(lastIndex), isError: false });
    }

    // Se não encontrou erros no texto, usar método alternativo
    if (parts.length === 0) {
        const regex = new RegExp(`(${erros.map(e => e.trecho.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
        const textParts = texto.split(regex).filter(Boolean);

        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-500 mb-2">
                    <AlertTriangleIcon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{erros.length} {erros.length === 1 ? 'erro encontrado' : 'erros encontrados'}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {textParts.map((part, index) => {
                        const erro = erros.find(e => part.toLowerCase().includes(e.trecho.toLowerCase()) || e.trecho.toLowerCase().includes(part.toLowerCase()));
                        if (erro) {
                            return (
                                <span key={index} className="relative group inline-block">
                                    <span className="bg-red-500/20 underline decoration-red-500 decoration-wavy decoration-from-font underline-offset-2 cursor-pointer transition-colors hover:bg-red-500/30 px-0.5">
                                        {part}
                                    </span>
                                    <ErrorTooltip erro={erro} />
                                </span>
                            );
                        }
                        return <span key={index}>{part}</span>;
                    })}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-500 mb-2">
                <AlertTriangleIcon className="w-5 h-5" />
                <span className="text-sm font-semibold">{erros.length} {erros.length === 1 ? 'erro encontrado' : 'erros encontrados'}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {parts.map((part, index) => {
                    if (part.isError && part.erro) {
                        return (
                            <span key={index} className="relative group inline-block">
                                <span className="bg-red-500/20 underline decoration-red-500 decoration-wavy decoration-from-font underline-offset-2 cursor-pointer transition-colors hover:bg-red-500/30 px-0.5">
                                    {part.text}
                                </span>
                                <ErrorTooltip erro={part.erro} />
                            </span>
                        );
                    }
                    return <span key={index}>{part.text}</span>;
                })}
            </p>
        </div>
    );
};

const AvaliacaoDetalhada: React.FC<{ correcao: CorrecaoCompleta; tema?: string; textoOriginal?: string; }> = ({ correcao, tema, textoOriginal }) => (
    <div className="space-y-6">
        {tema && (
            <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-1">Tema Avaliado</h3>
                <p className="text-xs p-2 bg-muted/30 rounded-md">{tema}</p>
            </div>
        )}

        {correcao.avaliacaoGeral && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-5 border border-primary/20">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Avaliação Geral
                </h3>
                <div className="text-sm text-foreground leading-relaxed space-y-3">
                    {correcao.avaliacaoGeral.split('\n').map((paragrafo, idx) => {
                        const trimmed = paragrafo.trim();
                        if (!trimmed) return null;
                        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
                            return (
                                <div key={idx} className="flex items-start gap-2 pl-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span>{trimmed.replace(/^[-•*]\s*/, '')}</span>
                                </div>
                            );
                        }
                        return <p key={idx} className="text-justify">{paragrafo}</p>;
                    })}
                </div>
            </div>
        )}

        <div>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Análise por Critério
            </h3>
            <div className="space-y-4">
                {correcao.avaliacaoDetalhada.map((item, i) => {
                    const percentual = (item.pontuacao / item.maximo) * 100;
                    const getColorClass = (percent: number) => {
                        if (percent >= 80) return 'text-green-500 bg-green-500/10 border-green-500/30';
                        if (percent >= 60) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
                        return 'text-red-500 bg-red-500/10 border-red-500/30';
                    };

                    return (
                        <div key={i} className={`p-5 rounded-lg border-2 ${getColorClass(percentual)} transition-all hover:shadow-lg`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-base text-foreground mb-1">{item.criterio}</h4>
                                    {item.peso && item.peso > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            Peso: {item.peso > 1 ? item.peso.toFixed(0) : (item.peso * 100).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`font-bold text-xl ${getColorClass(percentual).split(' ')[0]}`}>
                                        {item.pontuacao.toFixed(1)} / {item.maximo.toFixed(1)}
                                    </span>
                                    <div className="w-28 h-2.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${getColorClass(percentual).split(' ')[0]}`}
                                            style={{ width: `${Math.min(percentual, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">{percentual.toFixed(0)}%</span>
                                </div>
                            </div>
                            <div className="text-sm text-foreground leading-relaxed space-y-2">
                                {item.feedback.split('\n').map((paragrafo, idx) => {
                                    const trimmed = paragrafo.trim();
                                    if (!trimmed) return null;
                                    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
                                        return (
                                            <div key={idx} className="flex items-start gap-2 pl-2">
                                                <span className="text-primary/70 mt-0.5">▸</span>
                                                <span>{trimmed.replace(/^[-•*]\s*/, '')}</span>
                                            </div>
                                        );
                                    }
                                    // Detecta linhas numeradas tipo "1." ou "1)" e formata
                                    if (/^\d+[\.\)]/.test(trimmed)) {
                                        return (
                                            <div key={idx} className="flex items-start gap-2 pl-2">
                                                <span className="text-primary/70 font-medium">{trimmed.match(/^\d+[\.\)]/)?.[0]}</span>
                                                <span>{trimmed.replace(/^\d+[\.\)]\s*/, '')}</span>
                                            </div>
                                        );
                                    }
                                    return <p key={idx} className="text-justify">{paragrafo}</p>;
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {correcao.textoCorrigido && (
            <div>
                <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                    📝 Texto Corrigido
                    {textoOriginal && (
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            com alterações destacadas
                        </span>
                    )}
                </h3>
                <div className="p-4 bg-muted/30 rounded-lg border border-border max-h-[400px] overflow-y-auto">
                    {textoOriginal ? (
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {computeWordDiff(textoOriginal, correcao.textoCorrigido).map((part, index) => {
                                if (part.type === 'removed') {
                                    return (
                                        <span
                                            key={index}
                                            className="bg-red-500/20 text-red-600 dark:text-red-400 line-through decoration-red-500"
                                            title="Texto removido"
                                        >
                                            {part.text}
                                        </span>
                                    );
                                }
                                if (part.type === 'added') {
                                    return (
                                        <span
                                            key={index}
                                            className="bg-green-500/20 text-green-700 dark:text-green-400 font-medium"
                                            title="Texto adicionado/corrigido"
                                        >
                                            {part.text}
                                        </span>
                                    );
                                }
                                return <span key={index}>{part.text}</span>;
                            })}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{correcao.textoCorrigido}</p>
                    )}
                </div>
                {textoOriginal && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-red-500/20 border border-red-500/30 rounded inline-block"></span>
                            Removido
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded inline-block"></span>
                            Adicionado/Corrigido
                        </span>
                    </div>
                )}
            </div>
        )}

        <div className="bg-muted/30 rounded-lg p-5 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-3">📝 Comentários Gerais</h3>
            <div className="text-sm text-foreground leading-relaxed space-y-2">
                {correcao.comentariosGerais.split('\n').map((paragrafo, idx) => {
                    const trimmed = paragrafo.trim();
                    if (!trimmed) return null;
                    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
                        return (
                            <div key={idx} className="flex items-start gap-2 pl-2">
                                <span className="text-primary/70 mt-0.5">▸</span>
                                <span>{trimmed.replace(/^[-•*]\s*/, '')}</span>
                            </div>
                        );
                    }
                    return <p key={idx} className="text-justify">{paragrafo}</p>;
                })}
            </div>
        </div>

        {correcao.sinteseFinal && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-5 border-2 border-blue-500/20">
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    Síntese Final (Feedback Pedagógico)
                </h3>
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed space-y-3">
                    {correcao.sinteseFinal.split('\n').map((paragrafo, idx) => {
                        if (paragrafo.trim().startsWith('-') || paragrafo.trim().startsWith('•')) {
                            return (
                                <div key={idx} className="flex items-start gap-2 pl-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{paragrafo.trim().replace(/^[-•]\s*/, '')}</span>
                                </div>
                            );
                        }
                        return <p key={idx}>{paragrafo}</p>;
                    })}
                </div>
            </div>
        )}

        <div className="text-center pt-6 border-t-2 border-border">
            <p className="text-sm text-muted-foreground mb-2">Nota Final</p>
            <div className="space-y-3">
                <p className="text-6xl font-bold text-primary">{correcao.notaFinal.toFixed(1)}</p>
                <p className="text-lg text-muted-foreground">de {correcao.notaMaxima} pontos</p>
                <div className="w-full max-w-md mx-auto h-4 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                        style={{ width: `${Math.min((correcao.notaFinal / correcao.notaMaxima) * 100, 100)}%` }}
                    />
                </div>
                <p className="text-sm text-muted-foreground">
                    {((correcao.notaFinal / correcao.notaMaxima) * 100).toFixed(1)}% de aproveitamento
                </p>
            </div>
        </div>
    </div>
);


// Helper para gerar título da redação baseado no tema
const gerarTituloRedacao = (redacao: RedacaoCorrigida): string => {
    if (redacao.tema && redacao.tema.trim().length > 0) {
        // Limitar o título a 60 caracteres, cortando no último espaço antes do limite
        const temaLimpo = redacao.tema.trim();
        if (temaLimpo.length <= 60) {
            return temaLimpo;
        }
        const tituloCortado = temaLimpo.substring(0, 60);
        const ultimoEspaco = tituloCortado.lastIndexOf(' ');
        return ultimoEspaco > 0 ? tituloCortado.substring(0, ultimoEspaco) + '...' : tituloCortado + '...';
    }
    // Título padrão se não houver tema
    const dataFormatada = new Date(redacao.data).toLocaleDateString('pt-br', {
        day: '2-digit',
        month: 'short'
    });
    return `Redação ${redacao.banca} - ${dataFormatada}`;
};

const HistoricoProgresso: React.FC = () => {
    const historico = useRedacaoStore(state => state.historico);
    const removeRedacao = useRedacaoStore(state => state.removeRedacao);
    const [selectedCorrecao, setSelectedCorrecao] = useState<RedacaoCorrigida | null>(null);
    const [bancaFiltro, setBancaFiltro] = useState<string>('todas');
    const [mostrarComparacao, setMostrarComparacao] = useState(false);
    const [ordenacao, setOrdenacao] = useState<'data-recente' | 'data-antiga' | 'maior-nota' | 'menor-nota'>('data-recente');

    const bancasDisponiveis = useMemo(() => {
        const bancas = new Set(historico.map(h => h.banca));
        return ['todas', ...Array.from(bancas)];
    }, [historico]);

    // Helper para filtrar e ordenar histórico por banca
    const historicoFiltrado = useMemo(() => {
        let resultado = bancaFiltro === 'todas'
            ? [...historico]
            : historico.filter(h => h.banca === bancaFiltro);

        // Aplicar ordenação
        switch (ordenacao) {
            case 'data-recente':
                resultado.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
                break;
            case 'data-antiga':
                resultado.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
                break;
            case 'maior-nota':
                resultado.sort((a, b) => {
                    const percentualA = (a.correcao.notaFinal / a.correcao.notaMaxima) * 100;
                    const percentualB = (b.correcao.notaFinal / b.correcao.notaMaxima) * 100;
                    return percentualB - percentualA;
                });
                break;
            case 'menor-nota':
                resultado.sort((a, b) => {
                    const percentualA = (a.correcao.notaFinal / a.correcao.notaMaxima) * 100;
                    const percentualB = (b.correcao.notaFinal / b.correcao.notaMaxima) * 100;
                    return percentualA - percentualB;
                });
                break;
        }

        return resultado;
    }, [historico, bancaFiltro, ordenacao]);

    const evolutionData = useMemo(() => historicoFiltrado
        .map(h => ({
            data: new Date(h.data).toLocaleDateString('pt-br'),
            nota: h.correcao.notaFinal,
            notaMaxima: h.correcao.notaMaxima,
            notaPercentual: (h.correcao.notaFinal / h.correcao.notaMaxima) * 100
        }))
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()), [historicoFiltrado]);

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

    // Calcular estatísticas comparativas
    const estatisticasComparativas = useMemo(() => {
        if (historicoFiltrado.length < 2) return null;

        const notas = historicoFiltrado.map(h => h.correcao.notaFinal);
        const media = notas.reduce((sum, n) => sum + n, 0) / notas.length;
        const ultimaNota = notas[notas.length - 1];
        const penultimaNota = notas.length > 1 ? notas[notas.length - 2] : null;
        const melhorNota = Math.max(...notas);
        const piorNota = Math.min(...notas);
        const evolucao = penultimaNota ? ultimaNota - penultimaNota : 0;

        // Análise por critério
        const criteriosEvolucao: Record<string, { media: number; ultima: number; evolucao: number }> = {};
        historicoFiltrado.forEach(h => {
            h.correcao.avaliacaoDetalhada.forEach(c => {
                const criterioNome = c.criterio.split(':')[0];
                if (!criteriosEvolucao[criterioNome]) {
                    criteriosEvolucao[criterioNome] = { media: 0, ultima: 0, evolucao: 0 };
                }
                criteriosEvolucao[criterioNome].media += c.pontuacao;
            });
        });

        Object.keys(criteriosEvolucao).forEach(criterio => {
            const valores = historicoFiltrado.map(h => {
                const item = h.correcao.avaliacaoDetalhada.find(c => c.criterio.startsWith(criterio));
                return item ? item.pontuacao : 0;
            });
            criteriosEvolucao[criterio].media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
            criteriosEvolucao[criterio].ultima = valores[valores.length - 1];
            criteriosEvolucao[criterio].evolucao = valores.length > 1 ? valores[valores.length - 1] - valores[valores.length - 2] : 0;
        });

        return {
            media,
            ultimaNota,
            penultimaNota,
            melhorNota,
            piorNota,
            evolucao,
            criteriosEvolucao,
            totalRedacoes: historicoFiltrado.length
        };
    }, [historicoFiltrado]);

    if (historico.length === 0) {
        return <div className="text-center py-24 bg-card rounded-xl border-2 border-dashed border-border">
            <HistoryIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Sem Histórico</h3>
            <p className="text-muted-foreground mt-2">Corrija sua primeira redação para começar a acompanhar seu progresso.</p>
        </div>;
    }

    // Calcular melhores redações
    const melhoresRedacoes = useMemo(() => {
        return [...historicoFiltrado]
            .sort((a, b) => {
                const percentualA = (a.correcao.notaFinal / a.correcao.notaMaxima) * 100;
                const percentualB = (b.correcao.notaFinal / b.correcao.notaMaxima) * 100;
                return percentualB - percentualA;
            })
            .slice(0, 3);
    }, [historicoFiltrado]);

    // Estatísticas por banca
    const estatisticasPorBanca = useMemo(() => {
        const stats: Record<string, { total: number; media: number; melhor: number; pior: number }> = {};
        historico.forEach(h => {
            if (!stats[h.banca]) {
                stats[h.banca] = { total: 0, media: 0, melhor: 0, pior: Infinity };
            }
            const percentual = (h.correcao.notaFinal / h.correcao.notaMaxima) * 100;
            stats[h.banca].total++;
            stats[h.banca].media += percentual;
            stats[h.banca].melhor = Math.max(stats[h.banca].melhor, percentual);
            stats[h.banca].pior = Math.min(stats[h.banca].pior, percentual);
        });

        Object.keys(stats).forEach(banca => {
            stats[banca].media = stats[banca].media / stats[banca].total;
        });

        return stats;
    }, [historico]);

    const isPremium = useSubscriptionStore(state => state.planType === 'premium');

    return (
        <div className="space-y-8">
            {/* Filtro de Banca Melhorado */}
            <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <label className="text-sm font-semibold text-foreground whitespace-nowrap">Filtrar por Banca:</label>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {bancasDisponiveis.map(b => {
                                const isActive = bancaFiltro === b;
                                const count = b === 'todas' ? historico.length : historico.filter(h => h.banca === b).length;
                                return (
                                    <button
                                        key={b}
                                        onClick={() => setBancaFiltro(b)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive
                                            ? 'bg-primary text-primary-foreground shadow-lg'
                                            : 'bg-muted/50 text-foreground hover:bg-muted border border-border'
                                            }`}
                                    >
                                        {b === 'todas' ? 'Todas' : b}
                                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'
                                            }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {bancaFiltro !== 'todas' && (
                        <div className="text-sm text-muted-foreground">
                            {historicoFiltrado.length} {historicoFiltrado.length === 1 ? 'redação encontrada' : 'redações encontradas'}
                        </div>
                    )}
                </div>
            </div>

            {/* Estatísticas por Banca */}
            {Object.keys(estatisticasPorBanca).length > 1 && (
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border-2 border-purple-500/20 p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        Desempenho por Banca
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(estatisticasPorBanca).map(([banca, stats]: [string, any]) => (
                            <div key={banca} className="bg-card/50 rounded-lg p-4 border border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-foreground">{banca}</h4>
                                    <span className="text-xs text-muted-foreground">{stats.total} {stats.total === 1 ? 'redação' : 'redações'}</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Média:</span>
                                        <span className="font-bold text-primary">{stats.media.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Melhor:</span>
                                        <span className="font-bold text-green-500">{stats.melhor.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Pior:</span>
                                        <span className="font-bold text-red-500">{stats.pior.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Melhores Avaliações */}
            {melhoresRedacoes.length > 0 && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border-2 border-green-500/20 p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        Melhores Avaliações
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {melhoresRedacoes.map((redacao, index) => {
                            const percentual = (redacao.correcao.notaFinal / redacao.correcao.notaMaxima) * 100;
                            const medalha = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                            const titulo = gerarTituloRedacao(redacao);
                            return (
                                <div key={redacao.data} className="bg-card/50 rounded-lg p-4 border border-border hover:shadow-lg transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{medalha}</span>
                                            <span className="font-semibold text-foreground">#{index + 1}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(redacao.data).toLocaleDateString('pt-br')}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="mb-2">
                                            <h4 className="text-sm font-bold text-foreground line-clamp-2" title={redacao.tema || titulo}>
                                                {titulo}
                                            </h4>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Nota:</span>
                                            <span className="text-2xl font-bold text-green-500">
                                                {redacao.correcao.notaFinal.toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">de {redacao.correcao.notaMaxima} pontos</span>
                                            <span className="font-semibold text-green-500">{percentual.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                                                style={{ width: `${Math.min(percentual, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                                {redacao.banca}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Análise Comparativa (Premium Only) */}
            {estatisticasComparativas && estatisticasComparativas.totalRedacoes >= 2 && bancaFiltro !== 'todas' && (
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border-2 border-blue-500/20 p-6">
                    {!isPremium && (
                        <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
                            <SparklesIcon className="w-8 h-8 text-amber-500 mb-2" />
                            <h3 className="text-lg font-bold text-foreground">Recurso Premium</h3>
                            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                                A análise comparativa detalhada e evolução por critério são exclusivas do plano Premium.
                            </p>
                            <button
                                onClick={() => window.location.href = '/pagamento'}
                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-lg text-sm shadow-lg hover:scale-105 transition-transform"
                            >
                                Fazer Upgrade
                            </button>
                        </div>
                    )}

                    <div className={`flex items-center justify-between mb-4 ${!isPremium ? 'blur-sm' : ''}`}>
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="text-2xl">📈</span>
                            Análise Comparativa
                        </h3>
                        <button
                            onClick={() => isPremium && setMostrarComparacao(!mostrarComparacao)}
                            disabled={!isPremium}
                            className="text-sm text-primary hover:text-primary/80 font-semibold"
                        >
                            {mostrarComparacao ? 'Ocultar' : 'Mostrar Detalhes'}
                        </button>
                    </div>

                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 ${!isPremium ? 'blur-sm' : ''}`}>
                        <div className="bg-card/50 rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Média Geral</p>
                            <p className="text-2xl font-bold text-primary">{estatisticasComparativas.media.toFixed(1)}</p>
                        </div>
                        <div className="bg-card/50 rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Melhor Nota</p>
                            <p className="text-2xl font-bold text-green-500">{estatisticasComparativas.melhorNota.toFixed(1)}</p>
                        </div>
                        <div className="bg-card/50 rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Última Nota</p>
                            <p className="text-2xl font-bold text-foreground">{estatisticasComparativas.ultimaNota.toFixed(1)}</p>
                        </div>
                        <div className="bg-card/50 rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Evolução</p>
                            <p className={`text-2xl font-bold ${estatisticasComparativas.evolucao >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {estatisticasComparativas.evolucao >= 0 ? '+' : ''}{estatisticasComparativas.evolucao.toFixed(1)}
                            </p>
                        </div>
                    </div>

                    {mostrarComparacao && isPremium && (
                        <div className="mt-4 space-y-3">
                            <h4 className="font-semibold text-foreground mb-2">Evolução por Critério:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(estatisticasComparativas.criteriosEvolucao).map(([criterio, stats]: [string, any]) => (
                                    <div key={criterio} className="bg-card/50 rounded-lg p-3 border border-border">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-sm font-semibold text-foreground">{criterio}</p>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${stats.evolucao >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                                }`}>
                                                {stats.evolucao >= 0 ? '+' : ''}{stats.evolucao.toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Média:</span>
                                                <span className="text-foreground font-semibold">{stats.media.toFixed(1)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Última:</span>
                                                <span className="text-foreground font-semibold">{stats.ultima.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={[0, 100]} unit="%" />
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
                            <XAxis type="number" domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={12} unit="%" />
                            <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" width={80} fontSize={12} interval={0} tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                            <Bar dataKey="media" fill="var(--color-secondary)" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Repositório de Correções */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <HistoryIcon className="w-6 h-6 text-primary" />
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Repositório de Correções</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {historicoFiltrado.length} {historicoFiltrado.length === 1 ? 'redação corrigida' : 'redações corrigidas'}
                            </p>
                        </div>
                    </div>
                    {historicoFiltrado.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="ordenacao" className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</label>
                            <select
                                id="ordenacao"
                                value={ordenacao}
                                onChange={(e) => setOrdenacao(e.target.value as 'data-recente' | 'data-antiga' | 'maior-nota' | 'menor-nota')}
                                className="bg-card border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:ring-primary focus:border-primary cursor-pointer"
                            >
                                <option value="data-recente">Data (mais recente primeiro)</option>
                                <option value="data-antiga">Data (mais antiga primeiro)</option>
                                <option value="maior-nota">Maior nota primeiro</option>
                                <option value="menor-nota">Menor nota primeiro</option>
                            </select>
                        </div>
                    )}
                </div>

                {historicoFiltrado.length === 0 ? (
                    <div className="text-center py-16 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                        <HistoryIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h4 className="text-lg font-semibold text-foreground mb-2">Nenhuma correção encontrada</h4>
                        <p className="text-sm text-muted-foreground">
                            {bancaFiltro !== 'todas'
                                ? `Nenhuma redação encontrada para a banca "${bancaFiltro}".`
                                : 'Corrija sua primeira redação para começar a construir seu histórico.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {historicoFiltrado.map((redacao, index) => {
                            const percentual = (redacao.correcao.notaFinal / redacao.correcao.notaMaxima) * 100;
                            const isSelected = selectedCorrecao?.data === redacao.data;
                            const titulo = gerarTituloRedacao(redacao);
                            const dataFormatada = new Date(redacao.data);
                            const dataCompleta = dataFormatada.toLocaleDateString('pt-br', {
                                weekday: 'long',
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                            });
                            const horaFormatada = dataFormatada.toLocaleTimeString('pt-br', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            const getNotaColor = (percent: number) => {
                                if (percent >= 80) return 'text-green-500 bg-green-500/10 border-green-500/30';
                                if (percent >= 60) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
                                return 'text-red-500 bg-red-500/10 border-red-500/30';
                            };

                            return (
                                <div
                                    key={redacao.data}
                                    className={`rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${isSelected
                                        ? 'border-primary bg-primary/5 shadow-lg'
                                        : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40 hover:shadow-md'
                                        }`}
                                    onClick={() => setSelectedCorrecao(isSelected ? null : redacao)}
                                >
                                    {/* Cabeçalho do Card */}
                                    <div className="p-5 bg-gradient-to-r from-card to-muted/30 border-b border-border">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className="text-xs font-bold px-2 py-1 bg-primary/20 text-primary rounded-md">
                                                        #{historicoFiltrado.length - index}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md font-semibold">
                                                        {redacao.banca}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md">
                                                        {dataFormatada.toLocaleDateString('pt-br', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {horaFormatada}
                                                    </span>
                                                </div>
                                                <h4 className="text-lg font-bold text-foreground mb-1 line-clamp-2" title={redacao.tema || titulo}>
                                                    {titulo}
                                                </h4>
                                                {redacao.tema && redacao.tema.length > 60 && (
                                                    <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                                                        {redacao.tema}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Tem certeza que deseja excluir esta redação? Esta ação não pode ser desfeita.')) {
                                                            removeRedacao(redacao.id);
                                                            if (selectedCorrecao?.id === redacao.id) {
                                                                setSelectedCorrecao(null);
                                                            }
                                                        }
                                                    }}
                                                    className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors"
                                                    title="Excluir redação"
                                                >
                                                    <Trash2Icon className="w-4 h-4" />
                                                </button>
                                                <div className={`px-4 py-3 rounded-lg border-2 ${getNotaColor(percentual)} flex-shrink-0`}>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold">{redacao.correcao.notaFinal.toFixed(1)}</div>
                                                        <div className="text-xs opacity-80 mt-1">de {redacao.correcao.notaMaxima}</div>
                                                        <div className="text-xs font-semibold mt-1">{percentual.toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Estatísticas Rápidas */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold text-foreground">{redacao.correcao.errosDetalhados.length}</span>
                                                <span>{redacao.correcao.errosDetalhados.length === 1 ? 'erro' : 'erros'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold text-foreground">{redacao.correcao.avaliacaoDetalhada.length}</span>
                                                <span>critérios avaliados</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold text-foreground">{redacao.texto.length}</span>
                                                <span>caracteres</span>
                                            </div>
                                            <button
                                                className="ml-auto text-primary hover:text-primary/80 font-semibold transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCorrecao(isSelected ? null : redacao);
                                                }}
                                            >
                                                {isSelected ? '▼ Ocultar Detalhes' : '▶ Ver Detalhes Completos'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Detalhes Expandidos */}
                                    {isSelected && (
                                        <div className="p-5 bg-card/50 border-t-2 border-primary/20">
                                            <AvaliacaoDetalhada correcao={redacao.correcao} tema={redacao.tema} textoOriginal={redacao.texto} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
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

    const { addCorrecao, historico, iniciarCorrecao, cancelarCorrecao, fetchRedacoes } = useRedacaoStore();
    const editalAtivo = useEditalStore(state => state.editalAtivo);
    const correcaoEmAndamento = useRedacaoStore(state => state.correcaoEmAndamento);

    // Carregar redações ao montar ou trocar edital
    useEffect(() => {
        if (editalAtivo?.id) {
            fetchRedacoes(editalAtivo.id);
        }
    }, [editalAtivo?.id, fetchRedacoes]);

    // Sincronizar correção em andamento do store
    useEffect(() => {
        if (correcaoEmAndamento) {
            setIsLoading(true);
            setCorrecao(null);
        } else {
            setIsLoading(false);
        }
    }, [correcaoEmAndamento]);

    // Verificar se há correção concluída recentemente
    useEffect(() => {
        if (!correcaoEmAndamento && historico.length > 0) {
            const ultimaRedacao = historico[0];
            // Se a última redação foi criada há menos de 5 segundos, mostrar resultado
            const dataUltima = new Date(ultimaRedacao.data).getTime();
            const agora = Date.now();
            if (agora - dataUltima < 5000) {
                setCorrecao(ultimaRedacao.correcao);
            }
        }
    }, [correcaoEmAndamento, historico]);

    // Constante para limite de redações por mês
    // ✅ Fixed: Separated store access to prevent infinite loops
    const { getMaxRedacoesPerMonth, canCorrectRedacao, planType } = useSubscriptionStore();

    const LIMITE_REDACOES_MES = getMaxRedacoesPerMonth();
    const isPremium = planType === 'premium';

    // Função para contar redações do mês atual
    const redacoesNoMes = useMemo(() => {
        return useRedacaoStore.getState().getRedacoesDoMesAtual();
    }, [historico]);

    const redacoesRestantes = LIMITE_REDACOES_MES === -1 ? Infinity : Math.max(0, LIMITE_REDACOES_MES - redacoesNoMes);

    useEffect(() => {
        setBanca('Enem');
        setNotaMaxima(1000);
        setRedacao('');
        setTema('');
        setCorrecao(null);
    }, [activeTab]);

    useEffect(() => {
        if (banca === 'Enem') setNotaMaxima(1000);
        else if (banca === 'Cebraspe' || banca === 'CESPE') setNotaMaxima(100);
        else if (banca === 'FGV') setNotaMaxima(100);
        else setNotaMaxima(30);
    }, [banca]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isPremium) {
            toast.error("O upload de imagens (OCR) é exclusivo para assinantes Premium. Faça upgrade para utilizar!");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

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
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar limite de redações por mês
        if (LIMITE_REDACOES_MES !== -1 && redacoesNoMes >= LIMITE_REDACOES_MES) {
            toast.error(`Limite de ${LIMITE_REDACOES_MES} redações por mês atingido! O limite será resetado no próximo mês.`);
            return;
        }

        if (redacao.trim().length < 50) {
            toast.error("Por favor, insira um texto com pelo menos 50 caracteres.");
            return;
        }

        // Validar notas se avaliação manual estiver ativa
        if (usarAvaliacaoManual) {
            const criteriosComNota = [
                { key: 'conteudo', nome: 'Conteúdo', info: notasPesos.conteudo },
                { key: 'estrutura', nome: 'Estrutura', info: notasPesos.estrutura },
                { key: 'linguagem', nome: 'Linguagem', info: notasPesos.linguagem }
            ].filter(c => c.info && c.info.nota !== undefined && c.info.nota > 0);

            if (criteriosComNota.length === 0) {
                toast.error("Por favor, informe pelo menos uma nota para algum critério.");
                return;
            }

            // Validar se os máximos foram definidos para os critérios com nota
            for (const criterio of criteriosComNota) {
                if (!criterio.info || !criterio.info.maximo || criterio.info.maximo <= 0) {
                    toast.error(`Por favor, defina o valor máximo para o critério "${criterio.nome}" antes de informar a nota.`);
                    return;
                }
            }

            // Validar se as notas não excedem os máximos
            for (const criterio of criteriosComNota) {
                if (criterio.info && criterio.info.nota > criterio.info.maximo) {
                    toast.error(`A nota informada (${criterio.info.nota}) excede o máximo permitido (${criterio.info.maximo.toFixed(1)}) para o critério "${criterio.nome}".`);
                    return;
                }
            }
        }

        const notasPesosComObservacao = usarAvaliacaoManual
            ? { ...notasPesos, observacaoAvaliador: observacaoAvaliador || undefined }
            : undefined;

        // Iniciar correção em background usando o store
        await iniciarCorrecao(redacao, banca, notaMaxima, tema, notasPesosComObservacao);

        // Limpar formulário após iniciar
        setRedacao('');
        setTema('');
        setNotasPesos({});
        setObservacaoAvaliador('');
        setUsarAvaliacaoManual(false);
    };

    const TabButton: React.FC<{ label: string, icon: React.ElementType, active: boolean, onClick: () => void; }> = ({ label, icon: Icon, active, onClick }) => (
        <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 p-3 border-b-2 font-semibold transition-all ${active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}>
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div data-tutorial="corretor-content" className="space-y-6">
            <style>{`.tooltip-container:hover .tooltip-content { opacity: 1; }`}</style>
            <header>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><PencilRulerIcon className="w-8 h-8" /> Corretor de Redação IA</h1>
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
                            {/* Indicador de Correção em Andamento */}
                            {correcaoEmAndamento && (
                                <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-xl p-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <SparklesIcon className="w-6 h-6 text-blue-500 animate-pulse flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-blue-500">Correção em andamento...</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {correcaoEmAndamento.tema
                                                    ? `Tema: ${correcaoEmAndamento.tema.length > 50 ? correcaoEmAndamento.tema.substring(0, 50) + '...' : correcaoEmAndamento.tema}`
                                                    : `Banca: ${correcaoEmAndamento.banca} - Você pode navegar pela aplicação enquanto processamos.`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={cancelarCorrecao}
                                        className="px-3 py-1.5 text-xs font-semibold bg-red-500/20 text-red-500 rounded-md hover:bg-red-500/30 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}

                            {/* Aviso de Limite de Redações */}
                            {!correcaoEmAndamento && LIMITE_REDACOES_MES !== -1 && redacoesNoMes >= LIMITE_REDACOES_MES ? (
                                <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                                    <AlertTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-bold text-red-500 text-lg">Limite de {LIMITE_REDACOES_MES} redações atingido!</p>
                                        <p className="text-sm text-muted-foreground mt-1">Faça upgrade para o plano Premium para ter correções ilimitadas.</p>
                                    </div>
                                    <button onClick={() => window.location.href = '/pagamento'} className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg text-sm shadow-lg hover:bg-red-600 transition-colors">
                                        Fazer Upgrade
                                    </button>
                                </div>
                            ) : !correcaoEmAndamento && LIMITE_REDACOES_MES !== -1 && redacoesRestantes <= 3 ? (
                                <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl p-4 flex items-center gap-3">
                                    <AlertTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-bold text-yellow-500">Atenção: Apenas {redacoesRestantes} {redacoesRestantes === 1 ? 'correção restante' : 'correções restantes'}</p>
                                        <p className="text-sm text-muted-foreground mt-1">Você já usou {redacoesNoMes} de {LIMITE_REDACOES_MES} correções este mês.</p>
                                    </div>
                                    {!isPremium && (
                                        <button onClick={() => window.location.href = '/pagamento'} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-500 font-semibold rounded-lg text-xs hover:bg-yellow-500/30 transition-colors border border-yellow-500/30">
                                            Aumentar Limite
                                        </button>
                                    )}
                                </div>
                            ) : !correcaoEmAndamento && (
                                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isPremium ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            <SparklesIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Correções Disponíveis</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold text-foreground">{redacoesRestantes === Infinity ? '∞' : redacoesRestantes}</span>
                                                {redacoesRestantes !== Infinity && <span className="text-xs text-muted-foreground">/ {LIMITE_REDACOES_MES} mês</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {!isPremium && (
                                        <div className="text-right">
                                            <div className="text-xs font-semibold text-muted-foreground mb-1">Plano Atual: {planType.toUpperCase()}</div>
                                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-500"
                                                    style={{ width: `${Math.min((redacoesNoMes / LIMITE_REDACOES_MES) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Form Section */}
                            <div className="bg-card rounded-xl border border-border p-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="tema" className="block text-sm font-medium text-muted-foreground mb-1">Tema / Tópicos da Redação (Opcional)</label>
                                        <textarea id="tema" value={tema} onChange={(e) => setTema(e.target.value)} rows={3} className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary placeholder:text-muted-foreground" placeholder="Cole o tema da redação ou os textos de apoio aqui para uma correção mais precisa..." />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label htmlFor="redacao" className="block text-sm font-medium text-muted-foreground">Texto da Redação *</label>
                                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                                            <div className="flex items-center gap-2">
                                                {!isPremium && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/20">
                                                        PREMIUM
                                                    </span>
                                                )}
                                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isOcrLoading} className="px-2 py-1 flex items-center gap-1.5 rounded-md bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 disabled:opacity-50 transition-colors">
                                                    <CameraIcon className="w-4 h-4" /> {isOcrLoading ? 'Lendo...' : 'Enviar Foto (OCR)'}
                                                </button>
                                            </div>
                                        </div>
                                        <textarea id="redacao" value={redacao} onChange={(e) => setRedacao(e.target.value)} rows={12} className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary placeholder:text-muted-foreground" placeholder="Cole sua redação aqui ou envie uma foto..." />
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
                                        {!usarAvaliacaoManual && (
                                            <div>
                                                <label htmlFor="notaMaxima" className="block text-sm font-medium text-muted-foreground mb-1">Nota Máxima</label>
                                                <input type="number" id="notaMaxima" value={notaMaxima} onChange={e => setNotaMaxima(Number(e.target.value))} disabled={banca === 'Enem'} className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground disabled:opacity-50" />
                                            </div>
                                        )}
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
                                            <span className="text-sm font-medium text-foreground">Definir notas manualmente (IA irá interpretar e explicar)</span>
                                        </label>

                                        {usarAvaliacaoManual && (
                                            <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                                                <p className="text-xs text-muted-foreground mb-3">
                                                    Defina o valor máximo e a nota para cada critério de forma discricionária. Os pesos serão calculados automaticamente com base nos valores máximos definidos. A IA irá interpretar e explicar essas notas, não calculá-las.
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {['conteudo', 'estrutura', 'linguagem'].map((criterio) => {
                                                        const key = criterio as keyof NotasPesosEntrada;
                                                        const maximoAtual = notasPesos[key]?.maximo || 0;

                                                        return (
                                                            <div key={criterio} className="space-y-2">
                                                                <label className="block text-sm font-semibold text-foreground capitalize mb-2">
                                                                    {criterio === 'conteudo' ? 'Conteúdo' : criterio === 'estrutura' ? 'Estrutura' : 'Linguagem'}
                                                                </label>
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <label className="block text-xs text-muted-foreground mb-1">Valor Máximo</label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            min="0"
                                                                            max={notaMaxima}
                                                                            placeholder="Máximo"
                                                                            value={maximoAtual || ''}
                                                                            onChange={(e) => {
                                                                                const maximo = Number(e.target.value);
                                                                                if (maximo >= 0 && maximo <= notaMaxima) {
                                                                                    const peso = maximo > 0 ? maximo / notaMaxima : 0;
                                                                                    const notaAtual = notasPesos[key]?.nota || 0;
                                                                                    // Ajustar nota se exceder o novo máximo
                                                                                    const notaAjustada = notaAtual > maximo ? maximo : notaAtual;
                                                                                    setNotasPesos({
                                                                                        ...notasPesos,
                                                                                        [key]: {
                                                                                            nota: notaAjustada,
                                                                                            peso: peso,
                                                                                            maximo: maximo
                                                                                        }
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-muted-foreground mb-1">Nota</label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            min="0"
                                                                            max={maximoAtual || notaMaxima}
                                                                            placeholder={maximoAtual > 0 ? `Nota (máx: ${maximoAtual.toFixed(1)})` : "Nota"}
                                                                            value={notasPesos[key]?.nota || ''}
                                                                            onChange={(e) => {
                                                                                const nota = Number(e.target.value);
                                                                                const maximo = maximoAtual || notaMaxima;
                                                                                if (nota >= 0 && nota <= maximo) {
                                                                                    const peso = maximo > 0 ? maximo / notaMaxima : 0;
                                                                                    setNotasPesos({
                                                                                        ...notasPesos,
                                                                                        [key]: {
                                                                                            nota: nota,
                                                                                            peso: peso,
                                                                                            maximo: maximo
                                                                                        }
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                                                        />
                                                                    </div>
                                                                    {maximoAtual > 0 && (
                                                                        <div className="flex justify-between items-center text-xs">
                                                                            <span className="text-muted-foreground">Peso: {((maximoAtual / notaMaxima) * 100).toFixed(0)}%</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-2">Observação do Avaliador (Opcional)</label>
                                                    <textarea
                                                        value={observacaoAvaliador}
                                                        onChange={(e) => setObservacaoAvaliador(e.target.value)}
                                                        rows={3}
                                                        className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                                        placeholder="Comentários gerais sobre a redação..."
                                                    />
                                                </div>

                                                {/* Mostrar nota final calculada */}
                                                {Object.values(notasPesos).some((np: any) => np && np.nota > 0) && (
                                                    <div className="bg-primary/10 border border-primary/30 rounded-md p-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-semibold text-foreground">Nota Final Calculada:</span>
                                                            <span className="text-lg font-bold text-primary">
                                                                {(Object.values(notasPesos).reduce((sum: number, np: any) => {
                                                                    if (np && typeof np.nota === 'number') {
                                                                        return sum + np.nota;
                                                                    }
                                                                    return sum;
                                                                }, 0) as number).toFixed(1)} / {notaMaxima}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Soma das notas informadas nos critérios
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button type="submit" disabled={isLoading || isOcrLoading || (LIMITE_REDACOES_MES !== -1 && redacoesNoMes >= LIMITE_REDACOES_MES) || correcaoEmAndamento !== null} className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        <SparklesIcon className="w-5 h-5" />
                                        {isLoading || correcaoEmAndamento ? 'Corrigindo...' : 'Corrigir com IA'}
                                    </button>
                                    {correcaoEmAndamento && (
                                        <p className="text-xs text-center text-muted-foreground">
                                            A correção continuará em segundo plano. Você pode navegar pela aplicação.
                                        </p>
                                    )}
                                </form>
                            </div>

                            {/* Result Section */}
                            <AnimatePresence>
                                {(isLoading || isOcrLoading || correcao || correcaoEmAndamento) && (
                                    <motion.div
                                        key="results-section"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className="bg-card rounded-xl border border-border min-h-[500px] flex flex-col">
                                            <AnimatePresence mode="wait">
                                                {(isLoading || isOcrLoading || correcaoEmAndamento) ? (
                                                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center flex-1 text-center p-8">
                                                        <div className="relative mb-6">
                                                            <SparklesIcon className="w-16 h-16 text-primary animate-pulse" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                            </div>
                                                        </div>
                                                        <h3 className="font-semibold text-xl text-foreground mb-2">
                                                            {isOcrLoading ? 'Analisando imagem...' : correcaoEmAndamento ? 'Corrigindo em segundo plano...' : 'Analisando sua redação...'}
                                                        </h3>
                                                        <p className="text-muted-foreground mt-2 max-w-md">
                                                            {isOcrLoading
                                                                ? 'Aguarde enquanto a IA extrai o texto da imagem.'
                                                                : correcaoEmAndamento
                                                                    ? 'A correção está sendo processada. Você pode navegar pela aplicação enquanto aguarda.'
                                                                    : 'A IA está avaliando cada critério da sua redação. Isso pode levar alguns minutos.'
                                                            }
                                                        </p>
                                                        {correcaoEmAndamento && (() => {
                                                            const tempoDecorrido = Math.floor((Date.now() - new Date(correcaoEmAndamento.dataInicio).getTime()) / 1000);
                                                            const minutos = Math.floor(tempoDecorrido / 60);
                                                            const segundos = tempoDecorrido % 60;
                                                            return (
                                                                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                                                    <p className="text-sm text-blue-500 font-medium">
                                                                        ⏱️ Processando há {minutos > 0 ? `${minutos}min ` : ''}{segundos}s
                                                                    </p>
                                                                    {tempoDecorrido > 180 && (
                                                                        <p className="text-xs text-yellow-500 mt-1">
                                                                            A correção está demorando mais que o normal. Verifique o console para mais informações.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </motion.div>
                                                ) : correcao ? (
                                                    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-8">
                                                        {/* Resumo de Erros */}
                                                        {correcao.errosDetalhados && correcao.errosDetalhados.length > 0 && (
                                                            <div className="bg-card rounded-xl border-2 border-orange-500/30 p-4">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                                                        <AlertTriangleIcon className="w-5 h-5 text-orange-500" />
                                                                        Resumo de Erros
                                                                    </h3>
                                                                    <span className="text-sm font-semibold text-orange-500">
                                                                        {correcao.errosDetalhados.length} {correcao.errosDetalhados.length === 1 ? 'erro encontrado' : 'erros encontrados'}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                    {Array.from(new Set(correcao.errosDetalhados.map(e => e.tipo))).map((tipo, idx) => {
                                                                        const count = correcao.errosDetalhados.filter(e => e.tipo === tipo).length;
                                                                        return (
                                                                            <div key={idx} className="bg-muted/50 rounded-md p-2 text-xs">
                                                                                <span className="font-semibold text-foreground">{tipo}:</span>
                                                                                <span className="text-muted-foreground ml-1">{count}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="space-y-4">
                                                            <h3 className="text-xl font-bold text-foreground">Texto Corrigido</h3>
                                                            <div className="p-4 bg-muted/30 rounded-lg border border-border max-h-[400px] overflow-y-auto">
                                                                {renderRedacaoComErros(redacao, correcao.errosDetalhados)}
                                                            </div>
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