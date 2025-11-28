import React, { useState } from 'react';
import { DownloadIcon, UploadIcon, XIcon } from './icons';
import { exportFlashcardsToCSV, downloadCSV, importFlashcardsFromCSV, validateCsvFormat } from '../services/flashcardCsvService';
import { useFlashcardsStore } from '../stores/useFlashcardStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { toast } from './Sonner';

interface ImportExportModalProps {
    onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ onClose }) => {
    const { flashcards, addFlashcards } = useFlashcardsStore();
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const [importing, setImporting] = useState(false);
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [selectedDisciplinaId, setSelectedDisciplinaId] = useState('');

    // Listar todos os tópicos disponíveis
    const allTopics = disciplinas.flatMap(d =>
        d.topicos.map(t => ({ id: t.id, titulo: t.titulo, disciplina: d.nome }))
    );

    const handleExport = () => {
        if (flashcards.length === 0) {
            toast.error('Nenhum flashcard para exportar');
            return;
        }

        try {
            const csv = exportFlashcardsToCSV(flashcards);
            const filename = `flashcards_${new Date().toISOString().split('T')[0]}.csv`;
            downloadCSV(csv, filename);
            toast.success(`${flashcards.length} flashcards exportados com sucesso!`);
        } catch (error: any) {
            toast.error(`Erro ao exportar: ${error.message}`);
        }
    };

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

            // Validar e processar CSV
            const validation = validateCsvFormat(text);
            if (!validation.valid) throw new Error(validation.error);

            const imported = importFlashcardsFromCSV(text);
            const cards = imported.map(fc => ({
                pergunta: fc.pergunta,
                resposta: fc.resposta,
                tags: fc.tags ? fc.tags.split(';').filter(t => t.trim()) : [],
            }));

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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-6 max-w-lg w-full border border-border shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-foreground">Importar/Exportar Flashcards</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <XIcon className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Exportar */}
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-foreground">
                            <DownloadIcon className="w-5 h-5 text-primary" />
                            Exportar para CSV
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Baixe todos os seus flashcards em formato CSV
                        </p>
                        <button
                            onClick={handleExport}
                            disabled={flashcards.length === 0}
                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            Exportar {flashcards.length > 0 && `(${flashcards.length} cards)`}
                        </button>
                    </div>

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
                            💡 Aceita separadores , ou ; e arquivos sem cabeçalho (ordem: pergunta, resposta, tags)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
