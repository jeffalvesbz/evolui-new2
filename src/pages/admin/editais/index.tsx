import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../services/supabaseClient';
import { PlusIcon, Trash2Icon, EyeIcon, EyeOffIcon, SettingsIcon, FileTextIcon } from '../../../../components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import type { Database } from '../../../../types/supabase';

type EditalDefault = Database['public']['Tables']['editais_default']['Row'];
type StatusValidacao = NonNullable<EditalDefault['status_validacao']>;

type GrupoAfinidade = {
    chave: string;
    editais: EditalDefault[];
};

const AdminEditaisList: React.FC = () => {
    const navigate = useNavigate();
    const [editais, setEditais] = useState<EditalDefault[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEditais();
    }, []);

    const fetchEditais = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('editais_default')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching editais:', error);
        } else {
            setEditais(data || []);
        }
        setLoading(false);
    };

    const toggleVisibility = async (id: string, status: EditalDefault['status_validacao']) => {
        const currentStatus: StatusValidacao = (status ?? 'pendente') as StatusValidacao;
        const nextStatus: StatusValidacao = currentStatus === 'oculto' ? 'aprovado' : 'oculto';

        const { error } = await (supabase
            .from('editais_default') as any)
            .update({
                status_validacao: nextStatus
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating visibility:', error);
        } else {
            fetchEditais();
        }
    };

    const deleteEdital = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este edital?')) return;

        const { error } = await supabase
            .from('editais_default')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting edital:', error);
        } else {
            fetchEditais();
        }
    };

    // Normalizar string (remover acentos, lowercase)
    const normalizar = (texto: string): string => {
        if (!texto) return '';
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    };

    // Extrair palavras-chave significativas de um texto
    const extrairPalavrasChave = (texto: string): string[] => {
        if (!texto) return [];
        
        const stopWords = new Set([
            'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'por', 'a', 'o', 'as', 'os',
            'função', 'cargo', 'área', 'estadual', 'federal', 'municipal', 'policia', 'agente',
            'analista', 'auditor', 'contador', 'escrivao', 'delegado', 'papiloscopista'
        ]);

        const palavras = normalizar(texto)
            .split(/[\s\-–—]+/)
            .filter(palavra => palavra.length > 2 && !stopWords.has(palavra))
            .filter((palavra, index, array) => array.indexOf(palavra) === index); // Remove duplicatas

        return palavras;
    };

    // Extrair todas as palavras-chave de um edital (nome + cargo + banca)
    const extrairPalavrasChaveEdital = (edital: EditalDefault): string[] => {
        const palavras: string[] = [];
        
        // Palavras do nome
        palavras.push(...extrairPalavrasChave(edital.nome || ''));
        
        // Palavras do cargo
        if (edital.cargo) {
            palavras.push(...extrairPalavrasChave(edital.cargo));
        }
        
        // Palavras da banca (normalizada)
        if (edital.banca) {
            const bancaNormalizada = normalizar(edital.banca);
            if (bancaNormalizada.length > 2) {
                palavras.push(bancaNormalizada);
            }
        }
        
        // Extrair instituição/órgão do nome (primeira parte antes de " - ")
        const partesNome = (edital.nome || '').split(/ - | – /);
        if (partesNome.length > 0) {
            const instituicao = normalizar(partesNome[0]);
            const palavrasInstituicao = extrairPalavrasChave(partesNome[0]);
            palavras.push(...palavrasInstituicao);
        }
        
        return [...new Set(palavras)]; // Remove duplicatas
    };

    // Extrair categoria principal do edital (instituição/órgão)
    const extrairCategoria = (edital: EditalDefault): string => {
        const nomeCompleto = normalizar(edital.nome || '');
        const cargoCompleto = normalizar(edital.cargo || '');
        const bancaCompleta = normalizar(edital.banca || '');
        
        // Verificar se é Concurso Público Nacional Unificado (CNPU)
        if (nomeCompleto.includes('concurso publico nacional unificado') || 
            nomeCompleto.includes('cnpu') ||
            cargoCompleto.includes('concurso publico nacional unificado') ||
            cargoCompleto.includes('cnpu') ||
            bancaCompleta.includes('concurso publico nacional unificado') ||
            bancaCompleta.includes('cnpu')) {
            return 'Concurso Público Nacional Unificado';
        }
        
        // Tentar extrair do nome primeiro
        const partesNome = (edital.nome || '').split(/ - | – /);
        if (partesNome.length > 0) {
            const primeiraParte = partesNome[0].trim();
            const primeiraParteNormalizada = normalizar(primeiraParte);
            
            // Padrões comuns
            if (primeiraParteNormalizada.match(/^(policia federal|pf)/)) return 'Polícia Federal';
            if (primeiraParteNormalizada.match(/^(sefa-[a-z]{2}|secretaria.*fazenda)/)) {
                const match = primeiraParte.match(/SEFA-([A-Z]{2})/i);
                if (match) return `SEFA-${match[1]}`;
                return 'Secretaria da Fazenda';
            }
            if (primeiraParteNormalizada.match(/^(tcdf|tribunal.*contas)/)) return 'TCDF';
            return primeiraParte;
        }
        
        // Se não encontrar, usar banca como fallback
        return edital.banca || 'Outros';
    };

    // Calcular similaridade entre dois editais (considera nome, cargo, banca)
    const calcularSimilaridade = (edital1: EditalDefault, edital2: EditalDefault): number => {
        // Se ambos são da mesma categoria, alta similaridade
        const categoria1 = extrairCategoria(edital1);
        const categoria2 = extrairCategoria(edital2);
        
        // Se ambos são CNPU, garantir que fiquem juntos
        if (categoria1 === 'Concurso Público Nacional Unificado' && 
            categoria2 === 'Concurso Público Nacional Unificado') {
            return 0.8; // Alta similaridade para garantir agrupamento
        }
        
        const palavras1 = new Set(extrairPalavrasChaveEdital(edital1));
        const palavras2 = new Set(extrairPalavrasChaveEdital(edital2));

        if (palavras1.size === 0 && palavras2.size === 0) return 1;
        if (palavras1.size === 0 || palavras2.size === 0) return 0;

        const intersecao = [...palavras1].filter(p => palavras2.has(p)).length;
        const uniao = palavras1.size + palavras2.size - intersecao;

        let similaridade = intersecao / uniao;

        // Bonus por mesma categoria
        if (categoria1 === categoria2) {
            similaridade += 0.3; // Aumentado de 0.2 para 0.3
        }

        // Bonus por mesma banca
        if (edital1.banca && edital2.banca && normalizar(edital1.banca) === normalizar(edital2.banca)) {
            similaridade += 0.15;
        }

        // Bonus por cargo similar
        if (edital1.cargo && edital2.cargo) {
            const cargo1 = normalizar(edital1.cargo);
            const cargo2 = normalizar(edital2.cargo);
            if (cargo1 === cargo2) {
                similaridade += 0.25;
            } else if (cargo1.includes(cargo2) || cargo2.includes(cargo1)) {
                similaridade += 0.1;
            }
        }

        return Math.min(similaridade, 1.0); // Cap em 1.0
    };

    // Organizar editais por afinidade melhorada
    const gruposAfinidade = useMemo(() => {
        if (editais.length === 0) return [];

        // Primeiro, agrupar por categoria (instituição/órgão)
        const gruposPorCategoria: Record<string, EditalDefault[]> = {};
        
        editais.forEach((edital) => {
            const categoria = extrairCategoria(edital);
            if (!gruposPorCategoria[categoria]) {
                gruposPorCategoria[categoria] = [];
            }
            gruposPorCategoria[categoria].push(edital);
        });

        const grupos: GrupoAfinidade[] = [];

        // Para cada categoria, criar subgrupos por similaridade
        Object.keys(gruposPorCategoria).sort().forEach((categoria) => {
            const editaisCategoria = gruposPorCategoria[categoria];

            // Se for CNPU, colocar todos em um único grupo
            if (categoria === 'Concurso Público Nacional Unificado') {
                // Ordenar editais CNPU por nome
                const editaisOrdenados = [...editaisCategoria].sort((a, b) => {
                    if (a.ano && b.ano && a.ano !== b.ano) {
                        return b.ano - a.ano;
                    }
                    return a.nome.localeCompare(b.nome);
                });

                grupos.push({
                    chave: `cnpu-${editaisOrdenados[0].id}`,
                    editais: editaisOrdenados,
                });
                return;
            }

            // Para outras categorias, criar subgrupos por similaridade
            const editaisProcessados = new Set<string>();

            editaisCategoria.forEach((edital) => {
                if (editaisProcessados.has(edital.id)) return;

                const grupo: EditalDefault[] = [edital];
                editaisProcessados.add(edital.id);

                // Buscar editais similares na mesma categoria
                editaisCategoria.forEach((outroEdital) => {
                    if (editaisProcessados.has(outroEdital.id)) return;
                    if (edital.id === outroEdital.id) return;

                    const similaridade = calcularSimilaridade(edital, outroEdital);
                    
                    // Threshold de 0.25 para outras categorias
                    if (similaridade >= 0.25) {
                        grupo.push(outroEdital);
                        editaisProcessados.add(outroEdital.id);
                    }
                });

                // Ordenar grupo por similaridade ao primeiro
                grupo.sort((a, b) => {
                    const simA = calcularSimilaridade(grupo[0], a);
                    const simB = calcularSimilaridade(grupo[0], b);
                    if (simA !== simB) return simB - simA;
                    // Se mesma similaridade, ordenar por ano (mais recente primeiro)
                    if (a.ano && b.ano && a.ano !== b.ano) {
                        return b.ano - a.ano;
                    }
                    return a.nome.localeCompare(b.nome);
                });

                // Criar título do grupo
                let tituloGrupo = categoria;
                
                if (grupo.length > 1) {
                    // Tentar encontrar cargo comum
                    const cargos = grupo
                        .map(e => e.cargo)
                        .filter(c => c && c.trim().length > 0)
                        .map(c => normalizar(c || ''));
                    
                    if (cargos.length > 0) {
                        // Encontrar palavras comuns nos cargos
                        const palavrasCargos = cargos.map(c => extrairPalavrasChave(c));
                        const palavrasComunsCargo = palavrasCargos.reduce((comuns, palavras) => {
                            if (comuns.length === 0) return palavras;
                            return comuns.filter(p => palavras.includes(p));
                        }, [] as string[]);
                        
                        if (palavrasComunsCargo.length > 0) {
                            tituloGrupo = `${categoria} - ${palavrasComunsCargo.slice(0, 3).join(' ').toUpperCase()}`;
                        }
                    }
                }

                grupos.push({
                    chave: `${categoria}-${grupo[0].id}`,
                    editais: grupo,
                });
            });
        });

        // Ordenar grupos: grupos maiores primeiro, depois por categoria
        grupos.sort((a, b) => {
            if (a.editais.length !== b.editais.length) {
                return b.editais.length - a.editais.length;
            }
            const categoriaA = extrairCategoria(a.editais[0]);
            const categoriaB = extrairCategoria(b.editais[0]);
            if (categoriaA !== categoriaB) {
                return categoriaA.localeCompare(categoriaB);
            }
            return a.editais[0].nome.localeCompare(b.editais[0].nome);
        });

        return grupos;
    }, [editais]);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground">Gerenciar Editais Padrão</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/admin/editais/solicitacoes')}
                        className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-md flex items-center gap-2 font-medium"
                    >
                        <FileTextIcon className="w-5 h-5" />
                        Solicitações
                    </button>
                    <button
                        onClick={() => navigate('/admin/editais/novo')}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center gap-2 font-medium"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Novo Edital
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-muted-foreground">Carregando...</div>
            ) : (
                <div className="space-y-6">
                    {gruposAfinidade.map((grupo) => {
                        const categoria = extrairCategoria(grupo.editais[0]);
                        
                        // Criar título melhorado
                        let tituloGrupo = categoria;
                        const infoAdicional: string[] = [];
                        
                        if (grupo.editais.length > 1) {
                            // Verificar se todos têm a mesma banca
                            const bancas = grupo.editais
                                .map(e => e.banca)
                                .filter(b => b && b.trim().length > 0)
                                .map(b => normalizar(b || ''));
                            
                            if (bancas.length > 0) {
                                const bancaComum = bancas[0];
                                if (bancas.every(b => b === bancaComum)) {
                                    infoAdicional.push(bancas[0].toUpperCase());
                                }
                            }
                            
                            // Verificar cargos similares
                            const cargos = grupo.editais
                                .map(e => e.cargo)
                                .filter(c => c && c.trim().length > 0);
                            
                            if (cargos.length > 0) {
                                const palavrasCargos = cargos.map(c => extrairPalavrasChave(c || ''));
                                const palavrasComunsCargo = palavrasCargos.reduce((comuns, palavras) => {
                                    if (comuns.length === 0) return palavras;
                                    return comuns.filter(p => palavras.includes(p));
                                }, [] as string[]);
                                
                                if (palavrasComunsCargo.length > 0) {
                                    tituloGrupo = `${categoria} - ${palavrasComunsCargo.slice(0, 3).join(' ').toUpperCase()}`;
                                }
                            }
                        }

                        return (
                            <div key={grupo.chave} className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-border">
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {tituloGrupo}
                                    </h2>
                                    {infoAdicional.length > 0 && (
                                        <span className="text-sm text-muted-foreground">
                                            ({infoAdicional.join(' • ')})
                                        </span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {grupo.editais.length} {grupo.editais.length === 1 ? 'edital' : 'editais'}
                                    </span>
                                </div>
                                <div className="grid gap-4 pl-4">
                                    {grupo.editais.map((edital) => {
                                        const status = edital.status_validacao ?? 'pendente';
                                        const isVisible = status !== 'oculto';
                                        return (
                                            <Card key={edital.id} className="bg-card border-border">
                                                <CardContent className="p-6 flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-semibold text-foreground">{edital.nome}</h3>
                                                        <p className="text-muted-foreground">
                                                            {edital.banca || '—'} • {edital.cargo || '—'} • {edital.ano ?? '—'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status === 'oculto'
                                                                ? 'bg-zinc-500/10 text-zinc-400'
                                                                : status === 'pendente'
                                                                    ? 'bg-amber-500/10 text-amber-400'
                                                                    : 'bg-green-500/10 text-green-400'
                                                                }`}>
                                                                {status}
                                                            </span>
                                                            <button
                                                                onClick={() => toggleVisibility(edital.id, status)}
                                                                className={`p-2 rounded-md transition-colors ${!isVisible
                                                                    ? 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20'
                                                                    : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                                    }`}
                                                                title={isVisible ? 'Visível' : 'Oculto'}
                                                            >
                                                                {isVisible
                                                                    ? <EyeIcon className="w-5 h-5" />
                                                                    : <EyeOffIcon className="w-5 h-5" />}
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => navigate(`/admin/editais/${edital.id}`)}
                                                            className="p-2 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                                            title="Gerenciar"
                                                        >
                                                            <SettingsIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteEdital(edital.id)}
                                                            className="p-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                            title="Excluir"
                                                        >
                                                            <Trash2Icon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    {editais.length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                            Nenhum edital cadastrado.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminEditaisList;
