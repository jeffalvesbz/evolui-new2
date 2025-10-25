import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useModalStore } from '../stores/useModalStore';
import { useEditalStore } from '../stores/useEditalStore';
import { StudyPlan } from '../types';
import { XIcon, LandmarkIcon, PlusIcon, EditIcon, Trash2Icon, SaveIcon } from './icons';
import { toast } from './Sonner';

type FormState = Omit<StudyPlan, 'id'>;

const EditalManagementModal: React.FC = () => {
    const { isEditalModalOpen, closeEditalModal } = useModalStore();
    const { editais, addEdital, updateEdital, removeEdital } = useEditalStore();

    const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedEdital, setSelectedEdital] = useState<StudyPlan | null>(null);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormState>();

    useEffect(() => {
        if (isEditalModalOpen) {
            setMode('list');
            setSelectedEdital(null);
            setDeleteConfirmationId(null);
            reset({ nome: '', descricao: '', data_alvo: '' });
        }
    }, [isEditalModalOpen, reset]);

    const handleStartCreate = () => {
        setMode('create');
        setSelectedEdital(null);
        reset({ nome: '', descricao: '', data_alvo: '' });
    };

    const handleStartEdit = (edital: StudyPlan) => {
        setMode('edit');
        setSelectedEdital(edital);
        reset({
            nome: edital.nome,
            descricao: edital.descricao,
            data_alvo: edital.data_alvo
        });
    };

    const handleCancelForm = () => {
        setMode('list');
        setSelectedEdital(null);
    };

    const onSubmit = async (data: FormState) => {
        try {
            if (mode === 'create') {
                await addEdital(data);
                toast.success('Edital criado com sucesso!');
            } else if (mode === 'edit' && selectedEdital) {
                await updateEdital(selectedEdital.id, data);
                toast.success('Edital atualizado com sucesso!');
            }
            setMode('list');
        } catch (error) {
            toast.error('Ocorreu um erro ao salvar o edital.');
            console.error(error);
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            await removeEdital(id);
            toast.success('Edital e todos os seus dados foram removidos.');
            setDeleteConfirmationId(null);
        } catch (error) {
            toast.error('Ocorreu um erro ao remover o edital.');
            console.error(error);
        }
    };

    if (!isEditalModalOpen) return null;

    const renderList = () => (
        <>
            <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <LandmarkIcon className="w-6 h-6 text-primary" />
                    <h2 className="text-lg font-bold">Gerenciar Editais</h2>
                </div>
                <button type="button" onClick={closeEditalModal} className="p-1.5 rounded-full hover:bg-muted">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
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
                                <button onClick={() => handleStartEdit(edital)} className="p-2 rounded hover:bg-background"><EditIcon className="w-4 h-4 text-muted-foreground"/></button>
                                <button onClick={() => setDeleteConfirmationId(edital.id)} className="p-2 rounded hover:bg-background"><Trash2Icon className="w-4 h-4 text-red-500"/></button>
                            </div>
                        )}
                    </div>
                ))}
                 {editais.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum edital cadastrado.</p>}
            </div>
            <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
                <button onClick={handleStartCreate} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                    <PlusIcon className="w-4 h-4"/> Novo Edital
                </button>
            </div>
        </>
    );

    const renderForm = () => (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold">{mode === 'create' ? 'Novo Edital' : 'Editar Edital'}</h2>
                <button type="button" onClick={handleCancelForm} className="p-1.5 rounded-full hover:bg-muted">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Nome do Edital *</label>
                    <input {...register('nome', { required: 'O nome é obrigatório' })} className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                    {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Descrição</label>
                    <textarea {...register('descricao')} rows={3} className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Data Alvo *</label>
                    <input type="date" {...register('data_alvo', { required: 'A data é obrigatória' })} className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                    {errors.data_alvo && <p className="text-xs text-red-500 mt-1">{errors.data_alvo.message}</p>}
                </div>
            </div>
            <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
                <button type="button" onClick={handleCancelForm} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
                <button type="submit" className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                    <SaveIcon className="w-4 h-4"/> Salvar
                </button>
            </div>
        </form>
    );

    return (
         <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={closeEditalModal}>
            <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                {mode === 'list' ? renderList() : renderForm()}
            </div>
        </div>
    );
};

export default EditalManagementModal;
