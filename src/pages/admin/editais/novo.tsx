import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../services/supabaseClient';
import { processarTextoEdital } from '../../../../services/geminiService';
import { ArrowLeftIcon } from '../../../../components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';

const AdminEditalNovo: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'manual' | 'json' | 'texto'>('manual');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processandoTexto, setProcessandoTexto] = useState(false);

    // Manual Mode State
    const [formData, setFormData] = useState({
        nome: '',
        banca: '',
        ano: new Date().getFullYear(),
        cargo: '',
        data_prova: ''
    });

    // JSON Mode State
    const [jsonInput, setJsonInput] = useState('');

    // Texto Mode State
    const [textoInput, setTextoInput] = useState('');

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('editais_default')
                .insert([formData]);

            if (error) throw error;

            navigate('/admin/editais');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Função recursiva para processar hierarquia de conteúdo (tópicos, subtópicos, itens)
    const processarConteudo = (
        conteudo: any[],
        disciplinaId: string,
        topicosParaInserir: Array<{ disciplina_default_id: string; nome: string; ordem: number }>,
        ordemBase: number = 0,
        nivel: number = 0
    ) => {
        conteudo.forEach((item: any, index: number) => {
            if (!item || !item.titulo) return;

            const titulo = item.titulo;
            const indice = item.indice || '';
            const tipo = item.tipo || 'topico';

            // Monta o nome do tópico com o índice se disponível
            const nomeCompleto = indice ? `${indice} - ${titulo}` : titulo;

            // Adiciona o item atual
            topicosParaInserir.push({
                disciplina_default_id: disciplinaId,
                nome: nomeCompleto,
                ordem: ordemBase + (index * 100) + (nivel * 10)
            });

            // Processa filhos recursivamente se existirem
            if (item.filhos && Array.isArray(item.filhos) && item.filhos.length > 0) {
                processarConteudo(
                    item.filhos,
                    disciplinaId,
                    topicosParaInserir,
                    ordemBase + (index * 100) + (nivel * 10),
                    nivel + 1
                );
            }
        });
    };

    const handleJsonSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = JSON.parse(jsonInput);

            // Suporta dois formatos:
            // 1. Formato novo: { meta: { orgao, cargo, versao }, disciplinas: [{ nome, conteudo: [...] }] }
            // 2. Formato antigo: { nome, banca, ano, cargo, disciplinas: [{ nome, topicos: [...] }] }

            let nomeEdital = '';
            let banca = '';
            let ano = new Date().getFullYear();
            let cargo = '';

            // Detecta o formato e extrai informações do edital
            if (data.meta) {
                // Formato novo com meta
                nomeEdital = `${data.meta.orgao || ''} ${data.meta.cargo || ''}`.trim() || 'Edital Importado';
                cargo = data.meta.cargo || '';
                // Pode ter nome no nível raiz também
                if (data.nome) nomeEdital = data.nome;
            } else if (data.nome) {
                // Formato antigo
                nomeEdital = data.nome;
                banca = data.banca || '';
                ano = data.ano || new Date().getFullYear();
                cargo = data.cargo || '';
            } else {
                throw new Error('JSON inválido. Campos obrigatórios: nome ou meta.orgao/cargo, disciplinas.');
            }

            // Valida disciplinas
            if (!data.disciplinas || !Array.isArray(data.disciplinas)) {
                throw new Error('JSON inválido. Campo obrigatório: disciplinas (array).');
            }

            // 1. Create Edital
            const { data: editalData, error: editalError } = await supabase
                .from('editais_default')
                .insert([{
                    nome: nomeEdital,
                    banca: banca || data.meta?.orgao || '',
                    ano: ano,
                    cargo: cargo || data.meta?.cargo || ''
                }])
                .select()
                .single();

            if (editalError) throw editalError;

            const editalId = editalData.id;

            // Função para formatar texto em Title Case (primeira letra de cada palavra maiúscula)
            const formatarTitleCase = (texto: string): string => {
                if (!texto) return '';
                return texto
                    .split(' ')
                    .map(palavra => {
                        if (!palavra) return palavra;
                        // Manter siglas em maiúsculas (ex: TCDF, CEBRASPE)
                        if (palavra === palavra.toUpperCase() && palavra.length > 1) {
                            return palavra;
                        }
                        // Primeira letra maiúscula, resto minúscula
                        return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
                    })
                    .join(' ');
            };

            // 2. Create Disciplinas and Topicos
            for (const [index, disciplina] of data.disciplinas.entries()) {
                if (!disciplina.nome) continue;

                const { data: discData, error: discError } = await supabase
                    .from('disciplinas_default')
                    .insert([{
                        edital_default_id: editalId,
                        nome: formatarTitleCase(disciplina.nome),
                        ordem: index
                    }])
                    .select()
                    .single();

                if (discError) throw discError;

                const topicosParaInserir: Array<{ disciplina_default_id: string; nome: string; ordem: number }> = [];

                // Suporta formato novo com "conteudo"
                if (disciplina.conteudo && Array.isArray(disciplina.conteudo)) {
                    processarConteudo(disciplina.conteudo, discData.id, topicosParaInserir, 0, 0);
                }
                // Suporta formato antigo com "topicos"
                else if (disciplina.topicos && Array.isArray(disciplina.topicos)) {
                    disciplina.topicos.forEach((topico: any, tIndex: number) => {
                        // Se o tópico é uma string, usa diretamente
                        if (typeof topico === 'string') {
                            topicosParaInserir.push({
                                disciplina_default_id: discData.id,
                                nome: topico,
                                ordem: tIndex
                            });
                        }
                        // Se o tópico é um objeto com titulo
                        else if (typeof topico === 'object' && topico !== null) {
                            // Extrai o título do objeto
                            const titulo = topico.titulo || topico.nome || JSON.stringify(topico);

                            // Adiciona o tópico principal
                            topicosParaInserir.push({
                                disciplina_default_id: discData.id,
                                nome: titulo,
                                ordem: tIndex
                            });

                            // Se houver subtópicos, adiciona como tópicos filhos
                            if (topico.subtopicos && Array.isArray(topico.subtopicos)) {
                                topico.subtopicos.forEach((subtopico: any, sIndex: number) => {
                                    const subtitulo = typeof subtopico === 'string'
                                        ? subtopico
                                        : (subtopico.titulo || subtopico.nome || String(subtopico));

                                    topicosParaInserir.push({
                                        disciplina_default_id: discData.id,
                                        nome: subtitulo,
                                        ordem: tIndex * 1000 + sIndex // Usa ordem maior para subtópicos
                                    });
                                });
                            }
                        }
                    });
                }

                if (topicosParaInserir.length > 0) {
                    const { error: topicosError } = await supabase
                        .from('topicos_default')
                        .insert(topicosParaInserir);

                    if (topicosError) throw topicosError;
                }
            }

            navigate('/admin/editais');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessarTexto = async () => {
        setProcessandoTexto(true);
        setError(null);

        try {
            if (!textoInput || textoInput.trim().length < 50) {
                throw new Error('Texto muito curto. Forneça pelo menos 50 caracteres do edital.');
            }

            // Processar texto usando IA
            const data = await processarTextoEdital(textoInput);

            // Converter para JSON e usar a mesma lógica de importação
            setJsonInput(JSON.stringify(data, null, 2));
            setMode('json');

            // Processar automaticamente
            await handleJsonSubmit();
        } catch (err: any) {
            setError(err.message || 'Erro ao processar texto. Verifique se a API Key do Gemini está configurada.');
        } finally {
            setProcessandoTexto(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/editais')}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold text-foreground">Novo Edital Padrão</h1>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setMode('manual')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'manual'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                >
                    Modo Manual
                </button>
                <button
                    onClick={() => setMode('json')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'json'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                >
                    Modo JSON
                </button>
                <button
                    onClick={() => setMode('texto')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'texto'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                >
                    Processar Texto (IA)
                </button>
            </div>

            <Card className="bg-card border-border">
                <CardContent className="p-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md mb-6">
                            {error}
                        </div>
                    )}

                    {mode === 'manual' ? (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome do Edital</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full p-2 rounded-md bg-background border border-input focus:border-primary outline-none"
                                        placeholder="Ex: PF Agente 2021"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Banca</label>
                                    <input
                                        type="text"
                                        value={formData.banca}
                                        onChange={(e) => setFormData({ ...formData, banca: e.target.value })}
                                        className="w-full p-2 rounded-md bg-background border border-input focus:border-primary outline-none"
                                        placeholder="Ex: CEBRASPE"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ano</label>
                                    <input
                                        type="number"
                                        value={formData.ano || ''}
                                        onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) || 0 })}
                                        className="w-full p-2 rounded-md bg-background border border-input focus:border-primary outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cargo</label>
                                    <input
                                        type="text"
                                        value={formData.cargo}
                                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                        className="w-full p-2 rounded-md bg-background border border-input focus:border-primary outline-none"
                                        placeholder="Ex: Agente"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Data da Prova</label>
                                    <input
                                        type="date"
                                        value={formData.data_prova}
                                        onChange={(e) => setFormData({ ...formData, data_prova: e.target.value })}
                                        className="w-full p-2 rounded-md bg-background border border-input focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Criar Edital'}
                                </button>
                            </div>
                        </form>
                    ) : mode === 'json' ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cole o JSON do Edital</label>
                                <p className="text-xs text-muted-foreground">
                                    Suporta dois formatos: formato simples com "topicos" ou formato hierárquico com "conteudo" (tópicos, subtópicos, itens)
                                </p>
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    className="w-full h-96 p-4 rounded-md bg-zinc-950 border border-input font-mono text-sm focus:border-primary outline-none"
                                    placeholder={`{
  "meta": {
    "orgao": "TCDF",
    "cargo": "Auditor de Controle Externo",
    "versao": "1.0"
  },
  "disciplinas": [
    {
      "nome": "Direito Civil",
      "conteudo": [
        {
          "id": "uuid-t1",
          "indice": "1",
          "titulo": "Lei de Introdução às Normas do Direito Brasileiro",
          "tipo": "topico",
          "filhos": [
            {
              "id": "uuid-t1-1",
              "indice": "1.1",
              "titulo": "Vigência, Aplicação, Obrigatoriedade...",
              "tipo": "subtopico",
              "filhos": [
                {
                  "id": "uuid-t1-1-a",
                  "titulo": "Vigência",
                  "tipo": "item"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}`}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleJsonSubmit}
                                    disabled={loading}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Processando...' : 'Importar JSON'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cole o texto bruto do edital</label>
                                <p className="text-xs text-muted-foreground">
                                    Cole aqui o texto completo do edital (copiado de PDF ou documento). A IA irá extrair automaticamente as disciplinas e tópicos.
                                </p>
                                <textarea
                                    value={textoInput}
                                    onChange={(e) => setTextoInput(e.target.value)}
                                    className="w-full h-96 p-4 rounded-md bg-zinc-950 border border-input font-mono text-sm focus:border-primary outline-none"
                                    placeholder="Cole aqui o texto completo do edital. Exemplo:

EDITAL DE CONCURSO PÚBLICO Nº 01/2024
TRIBUNAL DE CONTAS DO DISTRITO FEDERAL - TCDF
CARGO: AUDITOR DE CONTROLE EXTERNO

CONTEÚDO PROGRAMÁTICO

1. DIREITO CIVIL
1.1 Lei de Introdução às Normas do Direito Brasileiro
1.1.1 Vigência e aplicação das leis
1.1.2 Conflito das leis no tempo
1.2 Contratos
1.2.1 Formação dos contratos
1.2.2 Efeitos dos contratos

2. DIREITO ADMINISTRATIVO
2.1 Princípios da Administração Pública
2.2 Atos Administrativos
..."
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleProcessarTexto}
                                    disabled={processandoTexto || loading}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processandoTexto ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            Processando com IA...
                                        </>
                                    ) : (
                                        'Processar Texto com IA'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminEditalNovo;
