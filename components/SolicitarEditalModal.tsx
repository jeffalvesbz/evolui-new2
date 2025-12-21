import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { UploadIcon, FileTextIcon, LinkIcon, LoaderIcon } from './icons';
import { toast } from './Sonner';
import { Modal } from './ui/BaseModal';

interface SolicitarEditalModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchTerm?: string;
}

const SolicitarEditalModal: React.FC<SolicitarEditalModalProps> = ({ isOpen, onClose, searchTerm = '' }) => {
    const [formData, setFormData] = useState({
        nome_edital: searchTerm || '',
        banca: '',
        cargo: '',
        ano: '',
        link_edital: '',
        observacoes: ''
    });
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error('Por favor, selecione apenas arquivos PDF.');
                return;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast.error('O arquivo PDF deve ter no máximo 10MB.');
                return;
            }
            setPdfFile(file);
        }
    };

    const uploadPdfToStorage = async (file: File): Promise<string | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `solicitacoes-editais/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('editais')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                // Se o bucket não existir, criar ele primeiro
                if (uploadError.message.includes('Bucket not found')) {
                    toast.error('Bucket de storage não configurado. Entre em contato com o suporte.');
                    return null;
                }
                throw uploadError;
            }

            // Retornar o caminho do arquivo para salvar no banco
            // A URL será gerada dinamicamente quando necessário para visualização
            return filePath;
        } catch (error: any) {
            console.error('Erro ao fazer upload do PDF:', error);
            toast.error('Erro ao fazer upload do PDF: ' + (error.message || 'Erro desconhecido'));
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome_edital.trim()) {
            toast.error('Por favor, informe o nome do edital.');
            return;
        }

        if (!formData.link_edital.trim() && !pdfFile) {
            toast.error('Por favor, forneça um link para o edital ou faça upload de um PDF.');
            return;
        }

        setSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            let arquivoPdfUrl: string | null = null;

            // Upload do PDF se houver
            if (pdfFile) {
                setUploading(true);
                arquivoPdfUrl = await uploadPdfToStorage(pdfFile);
                setUploading(false);

                if (!arquivoPdfUrl && !formData.link_edital.trim()) {
                    toast.error('Falha no upload do PDF. Por favor, forneça um link alternativo.');
                    setSubmitting(false);
                    return;
                }
            }

            // Inserir solicitação no banco
            const { error } = await supabase
                .from('solicitacoes_editais')
                .insert({
                    user_id: user.id,
                    nome_edital: formData.nome_edital.trim(),
                    banca: formData.banca.trim() || null,
                    cargo: formData.cargo.trim() || null,
                    ano: formData.ano ? parseInt(formData.ano) : null,
                    link_edital: formData.link_edital.trim() || null,
                    arquivo_pdf_url: arquivoPdfUrl,
                    observacoes: formData.observacoes.trim() || null,
                    status: 'pendente'
                });

            if (error) throw error;

            toast.success('Solicitação enviada com sucesso! Nossa equipe analisará e incluirá o edital em breve.');

            // Reset form
            setFormData({
                nome_edital: '',
                banca: '',
                cargo: '',
                ano: '',
                link_edital: '',
                observacoes: ''
            });
            setPdfFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            onClose();
        } catch (error: any) {
            console.error('Erro ao enviar solicitação:', error);
            toast.error('Erro ao enviar solicitação: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
        >
            <Modal.Header onClose={onClose}>
                <div className="flex items-center gap-2">
                    <FileTextIcon className="w-6 h-6 text-purple-400" />
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Solicitar Inclusão de Edital</h2>
                        <p className="text-sm text-muted-foreground">Não encontrou seu edital? Solicite a inclusão enviando o PDF ou link.</p>
                    </div>
                </div>
            </Modal.Header>

            <form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-6">
                    <div>
                        <label htmlFor="nome_edital" className="block text-sm font-medium text-muted-foreground mb-2">
                            Nome do Edital <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            id="nome_edital"
                            name="nome_edital"
                            value={formData.nome_edital}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-input border border-border text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-muted-foreground"
                            placeholder="Ex: Concurso Público para Analista Judiciário"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="banca" className="block text-sm font-medium text-muted-foreground mb-2">
                                Banca
                            </label>
                            <input
                                type="text"
                                id="banca"
                                name="banca"
                                value={formData.banca}
                                onChange={handleInputChange}
                                className="w-full bg-input border border-border text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-muted-foreground"
                                placeholder="Ex: FGV, CESPE, VUNESP"
                            />
                        </div>

                        <div>
                            <label htmlFor="cargo" className="block text-sm font-medium text-muted-foreground mb-2">
                                Cargo
                            </label>
                            <input
                                type="text"
                                id="cargo"
                                name="cargo"
                                value={formData.cargo}
                                onChange={handleInputChange}
                                className="w-full bg-input border border-border text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-muted-foreground"
                                placeholder="Ex: Analista Judiciário"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="ano" className="block text-sm font-medium text-muted-foreground mb-2">
                            Ano
                        </label>
                        <input
                            type="number"
                            id="ano"
                            name="ano"
                            value={formData.ano}
                            onChange={handleInputChange}
                            min="2000"
                            max="2100"
                            className="w-full bg-input border border-border text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-muted-foreground"
                            placeholder="Ex: 2024"
                        />
                    </div>

                    <div>
                        <label htmlFor="link_edital" className="block text-sm font-medium text-muted-foreground mb-2">
                            Link para o Edital
                        </label>
                        <div className="relative">
                            <LinkIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="url"
                                id="link_edital"
                                name="link_edital"
                                value={formData.link_edital}
                                onChange={handleInputChange}
                                className="w-full bg-input border border-border text-foreground pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-muted-foreground"
                                placeholder="https://exemplo.com/edital.pdf"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ou faça upload de um PDF abaixo
                        </p>
                    </div>

                    <div>
                        <label htmlFor="pdf_file" className="block text-sm font-medium text-muted-foreground mb-2">
                            Upload de PDF (máx. 10MB)
                        </label>
                        <div className="relative">
                            <input
                                ref={fileInputRef}
                                type="file"
                                id="pdf_file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="pdf_file"
                                className="flex items-center justify-center gap-3 w-full bg-input border-2 border-dashed border-border text-muted-foreground px-4 py-6 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                            >
                                <UploadIcon className="w-5 h-5" />
                                <span className="text-sm">
                                    {pdfFile ? pdfFile.name : 'Clique para selecionar um PDF'}
                                </span>
                            </label>
                        </div>
                        {pdfFile && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-emerald-400">
                                <FileTextIcon className="w-4 h-4" />
                                {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="observacoes" className="block text-sm font-medium text-muted-foreground mb-2">
                            Observações (opcional)
                        </label>
                        <textarea
                            id="observacoes"
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full bg-input border border-border text-foreground px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-muted-foreground resize-none"
                            placeholder="Informações adicionais sobre o edital..."
                        />
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting || uploading}
                        className="px-5 py-2.5 text-muted-foreground hover:text-foreground font-medium rounded-lg transition-colors border border-transparent hover:border-border disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || uploading}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {(submitting || uploading) && (
                            <LoaderIcon className="w-4 h-4 animate-spin" />
                        )}
                        {uploading ? 'Enviando PDF...' : submitting ? 'Enviando...' : 'Enviar Solicitação'}
                    </button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default SolicitarEditalModal;
