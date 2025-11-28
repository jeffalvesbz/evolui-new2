import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalStore } from '../stores/useModalStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useCiclosStore } from '../stores/useCiclosStore';
import { toast } from './Sonner';
import { Disciplina, SessaoCiclo, Ciclo } from '../types';
import { XIcon, BookOpenIcon, ClockIcon, SettingsIcon, CheckCircle2Icon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon } from './icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// --- Types ---
type MateriaCiclo = {
    id: string; // disciplinaId
    nome: string;
    tempoMinutos: number;
};

type FormData = {
    nomeCiclo: string;
    materias: MateriaCiclo[];
    tempoSessao: number; // in seconds
    sessoesGeradas: Omit<SessaoCiclo, 'id' | 'ordem'>[];
};

// --- Helper Functions ---
const formatMinutesToHours = (minutes: number) => {
    if (minutes < 0) return '0h00m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(1, '0')}h${m.toString().padStart(2, '0')}m`;
};

const COLORS = ['#22d3ee', '#c026d3', '#f97316', '#a855f7', '#16a34a', '#f59e0b', '#ef4444'];


// --- Sub-components for Steps ---

const Etapa1: React.FC<{ formMethods: any }> = ({ formMethods }) => {
    const { register, watch, setValue, formState: { errors } } = formMethods;
    const { disciplinas, addDisciplina } = useDisciplinasStore();
    const [customMateria, setCustomMateria] = useState('');

    const selectedMaterias: MateriaCiclo[] = watch('materias', []);
    const selectedMateriaIds = useMemo(() => new Set(selectedMaterias.map(m => m.id)), [selectedMaterias]);

    const handleSelectMateria = (disciplina: Disciplina) => {
        if (!selectedMateriaIds.has(disciplina.id)) {
            setValue('materias', [...selectedMaterias, { id: disciplina.id, nome: disciplina.nome, tempoMinutos: 180 }]);
        }
    };
    
    const handleAddCustomMateria = async () => {
        if (customMateria.trim() && !selectedMaterias.some(m => m.nome.toLowerCase() === customMateria.trim().toLowerCase())) {
            try {
                const novaDisciplina = await addDisciplina({ nome: customMateria.trim(), anotacoes: '', topicos: [] });
                setValue('materias', [...selectedMaterias, { id: novaDisciplina.id, nome: novaDisciplina.nome, tempoMinutos: 180 }]);
                setCustomMateria('');
                toast.success(`Matéria "${novaDisciplina.nome}" adicionada ao edital.`);
            } catch (error) {
                toast.error("Não foi possível adicionar a matéria personalizada.");
            }
        }
    };

    const handleRemoveMateria = (id: string) => {
        setValue('materias', selectedMaterias.filter(m => m.id !== id));
    };

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="nomeCiclo" className="block text-sm font-medium text-muted-foreground mb-1">Nome do Ciclo *</label>
                <input {...register('nomeCiclo', { required: 'O nome do ciclo é obrigatório.' })} id="nomeCiclo" placeholder="Ex: Ciclo de Estudos para Concurso X" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"/>
                {errors.nomeCiclo && <p className="text-xs text-red-500 mt-1">{errors.nomeCiclo.message as string}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Matérias Selecionadas ({selectedMaterias.length}) *</label>
                <div className="p-3 bg-muted/30 rounded-lg min-h-[4rem] flex flex-wrap gap-2 border border-border">
                    {selectedMaterias.length === 0 && <p className="text-sm text-muted-foreground">Selecione as matérias abaixo.</p>}
                    {selectedMaterias.map(materia => (
                        <span key={materia.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-tr from-primary to-secondary text-black text-sm font-bold">
                            {materia.nome}
                            <button type="button" onClick={() => handleRemoveMateria(materia.id)} className="p-0.5 rounded-full hover:bg-muted/50"><XIcon className="w-3.5 h-3.5"/></button>
                        </span>
                    ))}
                </div>
                 {errors.materias && <p className="text-xs text-red-500 mt-1">{errors.materias.message as string}</p>}
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Suas Disciplinas</h4>
                    <div className="flex flex-wrap gap-2">
                        {disciplinas.filter(d => !selectedMateriaIds.has(d.id)).map(d => (
                           <button type="button" key={d.id} onClick={() => handleSelectMateria(d)} className="px-3 py-1.5 rounded-full border border-border text-sm hover:bg-muted">{d.nome}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Adicionar Matéria Personalizada</h4>
                    <div className="flex gap-2">
                        <input value={customMateria} onChange={e => setCustomMateria(e.target.value)} placeholder="Digite o nome da matéria" className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" />
                        <button type="button" onClick={handleAddCustomMateria} className="h-10 px-4 flex items-center justify-center gap-2 rounded-lg bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30">
                            <PlusIcon className="w-4 h-4"/> Adicionar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Etapa2: React.FC<{ formMethods: any }> = ({ formMethods }) => {
    const { control, watch } = formMethods;
    const { fields } = useFieldArray({ control, name: 'materias' });
    const watchedMaterias: MateriaCiclo[] = watch('materias');

    const totalTempoCicloMinutos = useMemo(() => watchedMaterias.reduce((acc, m) => acc + (Number(m.tempoMinutos) || 0), 0), [watchedMaterias]);
    const pieData = useMemo(() => watchedMaterias.map(m => ({ name: m.nome, value: Number(m.tempoMinutos) || 0 })), [watchedMaterias]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="text-lg font-bold">Defina a Duração por Matéria</h3>
                <p className="text-sm text-muted-foreground">Determine o tempo total (em minutos) que você dedicará a cada matéria em uma rotação completa do ciclo.</p>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                             <span className="font-semibold text-foreground flex-1">{watchedMaterias[index]?.nome}</span>
                             <Controller
                                control={control}
                                name={`materias.${index}.tempoMinutos`}
                                render={({ field: { onChange, value } }) => (
                                    <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min="0" className="w-24 bg-input border border-border rounded-md px-3 py-1.5 text-sm text-foreground"/>
                                )}
                             />
                             <span className="text-sm text-muted-foreground">minutos</span>
                        </div>
                    ))}
                </div>
            </div>
             <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold">Distribuição do Tempo</h3>
                <p className="text-sm text-muted-foreground mb-2">Total: <span className="font-bold text-primary">{formatMinutesToHours(totalTempoCicloMinutos)}</span></p>
                {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                                {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                             <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0.75rem',
                                    color: 'var(--color-foreground)'
                                }}
                                formatter={(value: number) => `${value} min`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Nenhuma matéria selecionada.</div>}
            </div>
        </div>
    );
};


const Etapa3: React.FC<{ formMethods: any }> = ({ formMethods }) => {
    const { control, watch, setValue } = formMethods;
    const { fields, move, remove } = useFieldArray({ control, name: 'sessoesGeradas' });
    const sessoesGeradas: Omit<SessaoCiclo, 'id' | 'ordem'>[] = watch('sessoesGeradas');

    const handleAddSessao = () => {
        // This function is not implemented in the original code, but we can assume it's for manual additions.
        // For now, let's keep it simple. It might be that the user has to go back to change times.
    };

    return (
        <div className="space-y-4">
             <h3 className="text-lg font-bold">Revise e Organize seu Ciclo</h3>
            <p className="text-sm text-muted-foreground">Arraste para reordenar, ajuste os tempos ou remova sessões. O ciclo irá rotacionar nesta ordem.</p>
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-2">
                {fields.map((field, index) => {
                    // FIX: Changed type to Map<string, string> to align with Map constructor usage
                    const disciplinasMap: Map<string, string> = useMemo(() => new Map(useDisciplinasStore.getState().disciplinas.map(d => [d.id, d.nome])), []);
                    return (
                        <div key={field.id} className="flex items-center gap-3 p-2 rounded-lg bg-black/20 border border-border">
                            <span className="font-bold text-muted-foreground w-6">{index + 1}.</span>
                            <span className="font-semibold text-foreground flex-1">{disciplinasMap.get(sessoesGeradas[index].disciplina_id)}</span>
                            <Controller
                                control={control}
                                name={`sessoesGeradas.${index}.tempo_previsto`}
                                render={({ field: { onChange, value } }) => (
                                     <input type="number" value={value / 60} onChange={e => onChange(Number(e.target.value) * 60)} min="1" className="w-20 bg-input border border-border rounded-md px-2 py-1 text-sm text-foreground"/>
                                )}
                             />
                             <span className="text-sm text-muted-foreground">min</span>
                             <div className="flex flex-col">
                                <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} className="p-1 rounded-md hover:bg-background disabled:opacity-30"><ArrowUpIcon className="w-3 h-3"/></button>
                                <button type="button" onClick={() => move(index, index + 1)} disabled={index === fields.length - 1} className="p-1 rounded-md hover:bg-background disabled:opacity-30"><ArrowDownIcon className="w-3 h-3"/></button>
                            </div>
                             <button type="button" onClick={() => remove(index)} className="p-1.5 rounded-md hover:bg-background"><Trash2Icon className="w-4 h-4 text-red-500"/></button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};


// --- Main Modal Component ---
const CriarCicloModal: React.FC = () => {
    const { isCriarCicloModalOpen, closeCriarCicloModal } = useModalStore();
    const { addCiclo, setCicloAtivoId } = useCiclosStore();
    
    const [etapa, setEtapa] = useState(1);
    const formMethods = useForm<FormData>({
        defaultValues: {
            nomeCiclo: '',
            materias: [],
            tempoSessao: 3600, // 60 minutos
            sessoesGeradas: [],
        }
    });
    const { handleSubmit, watch, setValue, trigger } = formMethods;

    const handleNext = async () => {
        let isValid = false;
        if (etapa === 1) {
            isValid = await trigger(['nomeCiclo', 'materias']);
            if (watch('materias').length === 0) {
                 toast.error('Selecione pelo menos uma matéria.');
                 isValid = false;
            }
        } else if (etapa === 2) {
            isValid = true;
            // Gerar sessões para a etapa 3
            const materias: MateriaCiclo[] = watch('materias');
            const tempoSessaoMinutos = watch('tempoSessao') / 60;
            const sessoes: Omit<SessaoCiclo, 'id' | 'ordem'>[] = [];
            
            materias.forEach(materia => {
                const numSessoes = Math.floor(materia.tempoMinutos / tempoSessaoMinutos);
                const resto = materia.tempoMinutos % tempoSessaoMinutos;
                
                for(let i=0; i < numSessoes; i++) {
                    sessoes.push({ disciplina_id: materia.id, tempo_previsto: tempoSessaoMinutos * 60 });
                }
                if (resto > 0) {
                    sessoes.push({ disciplina_id: materia.id, tempo_previsto: resto * 60 });
                }
            });
            setValue('sessoesGeradas', sessoes.sort(() => Math.random() - 0.5)); // Shuffle
        }

        if (isValid) {
            setEtapa(etapa + 1);
        }
    };
    
    const onSubmit = async (data: FormData) => {
        const novoCiclo: Omit<Ciclo, 'id' | 'studyPlanId'> = {
            nome: data.nomeCiclo,
            sessoes: data.sessoesGeradas.map((s, i) => ({
                id: `new-sessao-${i}`,
                ordem: i,
                ...s
            }))
        };
        try {
            const cicloCriado = await addCiclo(novoCiclo);
            setCicloAtivoId(cicloCriado.id);
            toast.success("Ciclo de estudos criado com sucesso!");
            closeCriarCicloModal();
        } catch (error) {
            toast.error("Não foi possível criar o ciclo.");
        }
    };

    if (!isCriarCicloModalOpen) return null;

    const etapas = [
        { icon: BookOpenIcon, title: 'Matérias' },
        { icon: ClockIcon, title: 'Duração' },
        { icon: SettingsIcon, title: 'Organização' },
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={closeCriarCicloModal}>
            <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-3xl my-auto max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold">Criar Novo Ciclo de Estudos</h2>
                    <button type="button" onClick={closeCriarCicloModal} className="p-1.5 rounded-full hover:bg-muted"><XIcon className="w-5 h-5"/></button>
                </header>

                <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 overflow-x-hidden">
                    {/* Stepper */}
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                        {etapas.map((item, index) => (
                            <React.Fragment key={index}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${etapa > index + 1 ? 'bg-secondary border-secondary text-black' : etapa === index + 1 ? 'border-primary text-primary scale-110' : 'border-border text-muted-foreground'}`}>
                                        {etapa > index + 1 ? <CheckCircle2Icon className="w-5 h-5" /> : <item.icon className="w-5 h-5"/>}
                                    </div>
                                    <span className={`mt-2 text-xs font-bold ${etapa === index + 1 ? 'text-primary' : 'text-muted-foreground'}`}>{item.title}</span>
                                </div>
                                {index < etapas.length - 1 && <div className={`flex-1 h-0.5 mx-4 ${etapa > index + 1 ? 'bg-secondary' : 'bg-border'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="min-h-[40vh]">
                        {etapa === 1 && <Etapa1 formMethods={formMethods} />}
                        {etapa === 2 && <Etapa2 formMethods={formMethods} />}
                        {etapa === 3 && <Etapa3 formMethods={formMethods} />}
                    </div>
                </div>

                <footer className="p-4 bg-muted/30 border-t border-border flex justify-between items-center">
                    <button type="button" onClick={() => etapa > 1 && setEtapa(etapa - 1)} disabled={etapa === 1} className="h-10 px-4 flex items-center gap-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50">
                        <ChevronLeftIcon className="w-4 h-4"/> Voltar
                    </button>
                    {etapa < 3 ? (
                        <button type="button" onClick={handleNext} className="h-10 px-6 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                            Próximo <ChevronRightIcon className="w-4 h-4"/>
                        </button>
                    ) : (
                        <button type="button" onClick={handleSubmit(onSubmit)} className="h-10 px-6 flex items-center gap-2 rounded-lg bg-secondary text-black text-sm font-bold hover:bg-secondary/90">
                            <CheckCircle2Icon className="w-4 h-4"/> Concluir e Salvar Ciclo
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default CriarCicloModal;