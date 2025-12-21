import React, { useState } from 'react';
import { UploadIcon } from './icons';
import { importFlashcardsFromCSV, validateCsvFormat } from '../services/flashcardCsvService';
import { useFlashcardsStore } from '../stores/useFlashcardStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { toast } from './Sonner';
import { Modal } from './ui/BaseModal';

interface ImportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
    const { flashcards, addFlashcards } = useFlashcardsStore();
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const [importing, setImporting] = useState(false);
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [selectedDisciplinaId, setSelectedDisciplinaId] = useState('');

    // Listar todos os tópicos disponíveis
    const allTopics = disciplinas.flatMap(d =>
        d.topicos.map(t => ({ id: t.id, titulo: t.titulo, disciplina: d.nome }))
    );

    const handleUnifiedImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!selectedTopicId && !selectedDisciplinaId) {
            toast.error('Selecione uma disciplina ou tópico para importar');
            return;
        }

        setImporting(true);

        try {
            const text = await file.text();

            // Validar e processar - Tentar Anki primeiro (suporta pipe e tab), depois CSV
            let cards: { pergunta: string; resposta: string; tags: string[] }[] = [];

            // Remover BOM se existir e normalizar quebras de linha
            const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

            console.log('[Import] Tamanho do texto:', cleanText.length, 'caracteres');
            console.log('[Import] Primeiros 200 chars:', JSON.stringify(cleanText.substring(0, 200)));

            // Estratégia: Tentar parser do Anki primeiro (suporta pipe | e tab)
            // Se falhar, tentar parser CSV como fallback
            try {
                const { importAnkiFile, extractAutoTags } = await import('../services/ankiImportService');
                const ankiResult = importAnkiFile(cleanText);

                console.log('[Import] Anki parser: cards encontrados:', ankiResult.cards.length);

                if (ankiResult.cards.length > 0) {
                    cards = ankiResult.cards.map(card => ({
                        pergunta: card.pergunta,
                        resposta: card.resposta,
                        tags: extractAutoTags(card.pergunta, card.resposta)
                    }));
                }
            } catch (ankiError) {
                console.log('[Import] Anki parser falhou:', ankiError);
            }

            // Se Anki não encontrou cards, tentar CSV
            if (cards.length === 0) {
                console.log('[Import] Tentando parser CSV...');
                const validation = validateCsvFormat(text);

                if (validation.valid) {
                    try {
                        const imported = importFlashcardsFromCSV(text);
                        cards = imported.map(fc => ({
                            pergunta: fc.pergunta,
                            resposta: fc.resposta,
                            tags: fc.tags ? fc.tags.split(';').filter(t => t.trim()) : [],
                        }));
                        console.log('[Import] CSV parser: cards encontrados:', cards.length);
                    } catch (csvError) {
                        console.log('[Import] CSV parser falhou:', csvError);
                    }
                }
            }

            // Se ainda não encontrou nenhum card, erro
            if (cards.length === 0) {
                throw new Error('Nenhum flashcard encontrado. Verifique se o arquivo usa o formato correto:\n- Anki: Pergunta|Resposta ou Pergunta[TAB]Resposta\n- CSV: pergunta,resposta');
            }

            // Determinar tópicos de destino
            let targetTopicIds: string[] = [];
            if (selectedDisciplinaId) {
                const disciplina = disciplinas.find(d => d.id === selectedDisciplinaId);
                if (disciplina) targetTopicIds = disciplina.topicos.map(t => t.id);
            } else if (selectedTopicId) {
                targetTopicIds = [selectedTopicId];
            }

            if (targetTopicIds.length === 0) {
                throw new Error('Nenhum tópico de destino encontrado');
            }

            // Distribuir flashcards
            const cardsPerTopic = Math.ceil(cards.length / targetTopicIds.length);
            for (let i = 0; i < targetTopicIds.length; i++) {
                const topicId = targetTopicIds[i];
                const startIdx = i * cardsPerTopic;
                const endIdx = Math.min(startIdx + cardsPerTopic, cards.length);
                const topicCards = cards.slice(startIdx, endIdx);

                if (topicCards.length > 0) {
                    await addFlashcards(topicCards, topicId);
                }
            }

            toast.success(`${cards.length} flashcards importados com sucesso!`);
            onClose();
        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(`Erro ao importar: ${error.message}`);
        } finally {
            setImporting(false);
            event.target.value = '';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
        >
            <Modal.Header onClose={onClose}>
                <h2 className="text-xl font-bold text-foreground">Importar Flashcards</h2>
            </Modal.Header>

            <Modal.Body className="space-y-6">
                {/* Importar Unificado */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-foreground">
                        <UploadIcon className="w-5 h-5 text-secondary" />
                        Importar Flashcards
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Importe de CSV ou TXT (com ou sem cabeçalhos)
                    </p>

                    {/* Seletor de Destino */}
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Importar para
                        </label>

                        {/* Disciplina */}
                        <select
                            value={selectedDisciplinaId}
                            onChange={(e) => {
                                setSelectedDisciplinaId(e.target.value);
                                if (e.target.value) setSelectedTopicId('');
                            }}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-2"
                        >
                            <option value="">Selecione uma disciplina...</option>
                            {disciplinas.map(disc => (
                                <option key={disc.id} value={disc.id}>
                                    📚 {disc.nome} (todos os tópicos)
                                </option>
                            ))}
                        </select>

                        <div className="text-center text-xs text-muted-foreground my-2">ou</div>

                        {/* Tópico específico */}
                        <select
                            value={selectedTopicId}
                            onChange={(e) => {
                                setSelectedTopicId(e.target.value);
                                if (e.target.value) setSelectedDisciplinaId('');
                            }}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            disabled={!!selectedDisciplinaId}
                        >
                            <option value="">Selecione um tópico específico...</option>
                            {allTopics.map(topic => (
                                <option key={topic.id} value={topic.id}>
                                    📖 {topic.disciplina} → {topic.titulo}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Input de arquivo */}
                    <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleUnifiedImport}
                        disabled={importing || (!selectedTopicId && !selectedDisciplinaId)}
                        className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    {importing && (
                        <p className="text-sm text-primary mt-2 animate-pulse">
                            Importando flashcards...
                        </p>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                        💡 <strong>CSV:</strong> aceita separadores , ou ; com/sem cabeçalho (pergunta,resposta,tags)<br />
                        💡 <strong>TXT:</strong> uma pergunta por linha separada por | ou tab (Pergunta|Resposta)
                    </p>
                </div>
            </Modal.Body>
        </Modal>
    );
};
