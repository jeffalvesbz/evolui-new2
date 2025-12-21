import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useModalStore } from '../stores/useModalStore';
import { useEditalStore } from '../stores/useEditalStore';
import { StudyPlan } from '../types';
import { LandmarkIcon, PlusIcon, EditIcon, Trash2Icon, SaveIcon, XIcon } from './icons';
import { toast } from './Sonner';
import { Modal } from './ui/BaseModal';

type FormState = Omit<StudyPlan, 'id'>;

const EditalManagementModal: React.FC = () => {
    const { isEditalModalOpen, closeEditalModal } = useModalStore();
    const { editais, addEdital, updateEdital, removeEdital, setEditalAtivo } = useEditalStore();

    const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedEdital, setSelectedEdital] = useState<StudyPlan | null>(null);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormState>();

    useEffect(() => {
        if (isEditalModalOpen) {
            setMode('list');
            setSelectedEdital(null);
            setDeleteConfirmationId(null);
            reset({ nome: '', descricao: '', data_alvo: '', banca: '', orgao: '' });
        }
    }, [isEditalModalOpen, reset]);

    const handleStartCreate = () => {
        setMode('create');
        setSelectedEdital(null);
        reset({ nome: '', descricao: '', data_alvo: '', banca: '', orgao: '' });
    };

    const handleStartEdit = (edital: StudyPlan) => {
        setMode('edit');
        setSelectedEdital(edital);
        reset({
            nome: edital.nome,
            descricao: edital.descricao,
            data_alvo: edital.data_alvo,
            banca: edital.banca,
            orgao: edital.orgao,
        });
    };

    const handleCancelForm = () => {
        setMode('list');
        setSelectedEdital(null);
    };

    const onSubmit = async (data: FormState) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (mode === 'create') {
                const novoEdital = await addEdital(data);
                setEditalAtivo(novoEdital); // UX Improvement: Set new edital as active
                toast.success(`Plano "${novoEdital.nome}" criado com sucesso! Agora adicione disciplinas na seção Edital.`);
            } else if (mode === 'edit' && selectedEdital) {
                await updateEdital(selectedEdital.id, data);
                toast.success(`Plano "${data.nome}" atualizado com sucesso!`);
            }
            setMode('list');
        } catch (error) {
            toast.error('Não foi possível salvar o plano de estudos. Verifique sua conexão e tente novamente.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await removeEdital(id);
            toast.success('Edital e todos os seus dados foram removidos.');
            setDeleteConfirmationId(null);
        } catch (error) {
            toast.error('Não foi possível remover o plano de estudos. Verifique sua conexão e tente novamente.');
            console.error(error);
        }
    };

    const renderListContent = () => (
        <>
            <Modal.Header onClose={closeEditalModal}>
                <div className="flex items-center gap-3">
                    <LandmarkIcon className="w-6 h-6 text-primary" />
                    <h2 className="text-lg font-bold">Gerenciar Editais</h2>
                </div>
            </Modal.Header>

            <Modal.Body className="space-y-3">
                {editais.map(edital => (
                    <div key={edital.id} className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{edital.nome}</p>
                            <p className="text-xs text-muted-foreground">Data Alvo: {new Date(edital.data_alvo).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                        </div>
                        {deleteConfirmationId === edital.id ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-red-400">Confirmar?</span>
                                <button onClick={() => handleDelete(edital.id)} className="px-2 py-1 text-xs rounded bg-red-500 text-white">Sim</button>
                                <button onClick={() => setDeleteConfirmationId(null)} className="px-2 py-1 text-xs rounded border border-border">Não</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleStartEdit(edital)} className="p-2 rounded hover:bg-background"><EditIcon className="w-4 h-4 text-muted-foreground" /></button>
                                <button onClick={() => setDeleteConfirmationId(edital.id)} className="p-2 rounded hover:bg-background"><Trash2Icon className="w-4 h-4 text-red-500" /></button>
                            </div>
                        )}
                    </div>
                ))}
                {editais.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum edital cadastrado.</p>}
            </Modal.Body>

            <Modal.Footer>
                <button onClick={handleStartCreate} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2" data-tutorial="novo-edital-button">
                    <PlusIcon className="w-5 h-5" /> Novo Edital
                </button>
            </Modal.Footer>
        </>
    );

    const renderFormContent = () => (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[95vh]">
            <Modal.Header onClose={handleCancelForm}>
                <h2 className="text-lg font-bold">{mode === 'create' ? 'Novo Edital' : 'Editar Edital'}</h2>
            </Modal.Header>

            <Modal.Body className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Nome do Edital *</label>
                    <input {...register('nome', { required: 'O nome é obrigatório' })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary" />
                    {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Órgão</label>
                        <input {...register('orgao')} placeholder="Ex: Receita Federal" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Banca</label>
                        <input {...register('banca')} placeholder="Ex: Cebraspe" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary" />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Descrição</label>
                    <textarea {...register('descricao')} rows={3} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Data Alvo *</label>
                    <input type="date" {...register('data_alvo', { required: 'A data é obrigatória' })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary" />
                    {errors.data_alvo && <p className="text-xs text-red-500 mt-1">{errors.data_alvo.message}</p>}
                </div>
            </Modal.Body>

            <Modal.Footer>
                <button type="button" onClick={handleCancelForm} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSubmitting ? 'Salvando...' : <><SaveIcon className="w-4 h-4" /> Salvar</>}
                </button>
            </Modal.Footer>
        </form>
    );

    return (
        <Modal
            isOpen={isEditalModalOpen}
            onClose={mode === 'list' ? closeEditalModal : handleCancelForm}
            size="lg"
        >
            {mode === 'list' ? renderListContent() : renderFormContent()}
        </Modal>
    );
};

export default EditalManagementModal;