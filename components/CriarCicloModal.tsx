



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
                <input {...register('nomeCiclo', { required: 'O nome do ciclo é obrigatório.' })} id="nomeCiclo" placeholder="Ex: Ciclo de Estudos para Concurso X" className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm"/>
                {errors.nomeCiclo && <p className="text-xs text-red-500 mt-1">{errors.nomeCiclo.message as string}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Matérias Selecionadas ({selectedMaterias.length}) *</label>
                <div className="p-3 bg-black/20 rounded-lg min-h-[4rem] flex flex-wrap gap-2 border border-border">
                    {selectedMaterias.length === 0 && <p className="text-sm text-muted-foreground">Selecione as matérias abaixo.</p>}
                    {selectedMaterias.map(materia => (
                        <span key={materia.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-tr from-primary to-secondary text-black text-sm font-bold">
                            {materia.nome}
                            <button type="button" onClick={() => handleRemoveMateria(materia.id)} className="p-0.5 rounded-full hover:bg-black/20"><XIcon className="w-3.5 h-3.5"/></button>
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
                        <input value={customMateria} onChange={e => setCustomMateria(e.target.value)} placeholder="Digite o nome da matéria" className="flex-1 bg-muted/50 border border-border rounded-md px-3 py-2 text-sm" />
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
                        <div key={field.id} className="flex items-center gap-3 p-2 rounded-lg bg-black/20">
                             <span className="font-semibold text-foreground flex-1">{watchedMaterias[index]?.nome}</span>
                             <Controller
                                control={control}
                                name={`materias.${index}.tempoMinutos`}
                                render={({ field: { onChange, value } }) => (
                                    <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min="0" className="w-24 bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm"/>
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
                ) : <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">...</div>}
            </div>
        </div>
    );
};

const Etapa3: React.FC<{ formMethods: any }> = ({ formMethods }) => {
    const { control, watch, setValue } = formMethods;
    const { fields, move } = useFieldArray({ control, name: 'sessoesGeradas' });
    const disciplinas = useDisciplinasStore(state => state.disciplinas);

    const materias: MateriaCiclo[] = watch('materias');
    const tempoSessao: number = watch('tempoSessao');
    const sessoesGeradas: Omit<SessaoCiclo, 'id' | 'ordem'>[] = watch('sessoesGeradas');

    const gerarSessoes = () => {
        if (tempoSessao <= 0) {
            toast.error("O tempo da sessão deve ser maior que zero.");
            return;
        }

        let blocosEstudo: { disciplina_id: string, tempo_previsto: number }[] = [];
        materias.forEach(materia => {
            const tempoTotalSegundos = materia.tempoMinutos * 60;
            const numSessoesCompletas = Math.floor(tempoTotalSegundos / tempoSessao);
            const tempoRestante = tempoTotalSegundos % tempoSessao;

            for (let i = 0; i < numSessoesCompletas; i++) {
                blocosEstudo.push({ disciplina_id: materia.id, tempo_previsto: tempoSessao });
            }
            if (tempoRestante > 0) {
                blocosEstudo.push({ disciplina_id: materia.id, tempo_previsto: tempoRestante });
            }
        });
        
        // Interleaving logic (simple round-robin for now)
        const sessoesPorMateria: Record<string, any[]> = {};
        blocosEstudo.forEach(bloco => {
            if (!sessoesPorMateria[bloco.disciplina_id]) {
                sessoesPorMateria[bloco.disciplina_id] = [];
            }
            sessoesPorMateria[bloco.disciplina_id].push(bloco);
        });

        const sessoesIntercaladas = [];
        let algumaMateriaTemSessao = true;
        while(algumaMateriaTemSessao) {
            algumaMateriaTemSessao = false;
            Object.values(sessoesPorMateria).forEach(sessoes => {
                if (sessoes.length > 0) {
                    sessoesIntercaladas.push(sessoes.shift());
                    algumaMateriaTemSessao = true;
                }
            });
        }

        setValue('sessoesGeradas', sessoesIntercaladas);
        toast.success(`${sessoesIntercaladas.length} sessões geradas!`);
    };

    // FIX: Add generic type to useMemo to ensure correct type inference for the map.
    const disciplinasMap = useMemo<Map<string, string>>(() => new Map(disciplinas.map(d => [d.id, d.nome])), [disciplinas]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-black/20 rounded-lg border border-border">
                <div className="flex-1 w-full">
                    <label htmlFor="tempoSessao" className="block text-sm font-medium text-muted-foreground mb-1">Tempo Padrão da Sessão</label>
                    <Controller
                        name="tempoSessao"
                        control={control}
                        render={({ field }) => (
                             <select {...field} onChange={e => field.onChange(Number(e.target.value))} className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm">
                                <option value={1800}>30 minutos</option>
                                <option value={2700}>45 minutos</option>
                                <option value={3600}>1 hora</option>
                                <option value={5400}>1 hora e 30 minutos</option>
                                <option value={7200}>2 horas</option>
                             </select>
                        )}
                    />
                </div>
                <button type="button" onClick={gerarSessoes} className="w-full sm:w-auto h-10 px-6 flex-shrink-0 mt-2 sm:mt-5 flex items-center justify-center gap-2 rounded-lg bg-primary text-black font-bold text-sm hover:opacity-90 transition-opacity">
                    <SettingsIcon className="w-4 h-4"/> Gerar Sessões
                </button>
            </div>
            
            <div>
                 <h3 className="text-lg font-bold mb-2">Plano de Sessões ({sessoesGeradas.length})</h3>
                 <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 border-l-2 border-border pl-4">
                     {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Clique em "Gerar Sessões" para ver seu plano.</p>}
                     {fields.map((field, index) => (
                         <div key={field.id} className="flex items-center gap-3 p-2 rounded-lg bg-black/20 group">
                             <span className="font-mono text-sm bg-muted/50 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground">{index + 1}</span>
                             <div className="flex-1">
                                <p className="font-semibold text-foreground">{disciplinasMap.get(sessoesGeradas[index].disciplina_id) || 'Desconhecida'}</p>
                                <p className="text-xs text-muted-foreground">{formatMinutesToHours(sessoesGeradas[index].tempo_previsto / 60)}</p>
                             </div>
                             <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} className="p-1 rounded-md hover:bg-background disabled:opacity-30"><ArrowUpIcon className="w-3 h-3"/></button>
                                <button type="button" onClick={() => move(index, index + 1)} disabled={index === fields.length - 1} className="p-1 rounded-md hover:bg-background disabled:opacity-30"><ArrowDownIcon className="w-3 h-3"/></button>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

const Etapa4: React.FC<{ formMethods: any }> = ({ formMethods }) => {
    const { watch } = formMethods;
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const nomeCiclo: string = watch('nomeCiclo');
    const sessoesGeradas: Omit<SessaoCiclo, 'id' | 'ordem'>[] = watch('sessoesGeradas');
    // FIX: Add generic type to useMemo to ensure correct type inference for the map.
    const disciplinasMap = useMemo<Map<string, string>>(() => new Map(disciplinas.map(d => [d.id, d.nome])), [disciplinas]);
    const totalTempo = sessoesGeradas.reduce((acc: number, s) => acc + (s.tempo_previsto || 0), 0);

    return (
        <div className="text-center space-y-6">
            <CheckCircle2Icon className="w-16 h-16 text-secondary mx-auto"/>
            <h2 className="text-2xl font-bold">Ciclo Gerado com Sucesso!</h2>
            <p className="text-muted-foreground">Confira o resumo do seu novo ciclo de estudos. Se tudo estiver correto, clique em "Salvar Ciclo".</p>
            <div className="p-4 rounded-lg border border-border bg-black/20 text-left space-y-4">
                <h3 className="font-bold text-lg text-foreground">{nomeCiclo}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Total de Sessões:</span> <span className="font-semibold text-foreground">{sessoesGeradas.length}</span></div>
                    <div><span className="text-muted-foreground">Duração Total:</span> <span className="font-semibold text-foreground">{formatMinutesToHours(totalTempo / 60)}</span></div>
                </div>
                 <div className="max-h-[30vh] overflow-y-auto pr-2 space-y-2">
                    {sessoesGeradas.map((sessao, index) => (
                         <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                             <span className="font-mono text-xs bg-muted/50 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground">{index + 1}</span>
                             <p className="font-medium text-foreground flex-1">{disciplinasMap.get(sessao.disciplina_id) || 'Desconhecida'}</p>
                             <p className="text-sm text-muted-foreground">{formatMinutesToHours(sessao.tempo_previsto / 60)}</p>
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CriarCicloModal: React.FC = () => {
    const { isCriarCicloModalOpen, closeCriarCicloModal } = useModalStore();
    const { addCiclo, setCicloAtivoId } = useCiclosStore();
    const [step, setStep] = useState(1);

    const formMethods = useForm<FormData>({
        defaultValues: {
            nomeCiclo: '',
            materias: [],
            tempoSessao: 3600, // 1 hour
            sessoesGeradas: [],
        },
    });
    const { handleSubmit, watch, reset } = formMethods;
    
    const closeModal = () => {
        reset();
        setStep(1);
        closeCriarCicloModal();
    }

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));
    
    const handleNextValidation = () => {
        if(step === 1 && (!watch('nomeCiclo') || watch('materias').length === 0)){
            toast.error("Por favor, dê um nome ao ciclo e selecione pelo menos uma matéria.");
            return;
        }
        if(step === 2 && watch('materias').some(m => m.tempoMinutos <= 0)){
             toast.error("Todas as matérias devem ter uma duração maior que zero.");
            return;
        }
        if(step === 3 && watch('sessoesGeradas').length === 0)){
             toast.error("Gere as sessões de estudo antes de prosseguir.");
            return;
        }
        nextStep();
    }

    const onSave = async (data: FormData) => {
        try {
            const novoCicloData = {
                nome: data.nomeCiclo,
                sessoes: data.sessoesGeradas.map((sessao, index) => ({
                    ...sessao,
                    ordem: index,
                })),
            };
            const cicloCriado = await addCiclo(novoCicloData as Omit<Ciclo, 'id' | 'studyPlanId'>);
            if (cicloCriado) {
                setCicloAtivoId(cicloCriado.id);
                toast.success(`Ciclo "${cicloCriado.nome}" criado e ativado!`);
                closeModal();
            }
        } catch (e) {
            console.error("Failed to save ciclo", e);
        }
    };

    const steps = [
        { num: 1, title: 'Matérias', icon: BookOpenIcon },
        { num: 2, title: 'Duração', icon: ClockIcon },
        { num: 3, title: 'Sessões', icon: SettingsIcon },
        { num: 4, title: 'Resumo', icon: CheckCircle2Icon },
    ];
    
    const currentStepInfo = steps[step - 1];

    if (!isCriarCicloModalOpen) return null;

    return (
         <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={closeModal}>
            <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Criar Ciclo de Estudos</h2>
                        <p className="text-sm text-muted-foreground">Etapa {step}: {currentStepInfo.title}</p>
                    </div>
                     <button type="button" onClick={closeModal} className="p-1.5 rounded-full hover:bg-muted"><XIcon className="w-5 h-5" /></button>
                </header>

                <div className="p-6 flex-shrink-0">
                    <div className="w-full bg-black/20 rounded-full h-1.5 mb-4">
                        <div className="bg-gradient-to-r from-primary to-secondary h-1.5 rounded-full transition-all duration-500" style={{ width: `${((step -1) / (steps.length - 1)) * 100}%` }}></div>
                    </div>
                </div>

                <main className="px-6 pb-6 flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ x: 30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -30, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {step === 1 && <Etapa1 formMethods={formMethods} />}
                            {step === 2 && <Etapa2 formMethods={formMethods} />}
                            {step === 3 && <Etapa3 formMethods={formMethods} />}
                            {step === 4 && <Etapa4 formMethods={formMethods} />}
                        </motion.div>
                    </AnimatePresence>
                </main>
                
                <footer className="p-4 bg-black/20 border-t border-border flex justify-between items-center flex-shrink-0">
                    <button onClick={prevStep} disabled={step === 1} className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 flex items-center gap-2">
                        <ChevronLeftIcon className="w-4 h-4"/> Anterior
                    </button>
                    {step < 4 ? (
                        <button onClick={handleNextValidation} className="h-10 px-4 rounded-lg bg-primary text-black font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                            Próximo <ChevronRightIcon className="w-4 h-4"/>
                        </button>
                    ) : (
                        <button onClick={handleSubmit(onSave)} className="h-10 px-4 rounded-lg bg-gradient-to-tr from-primary to-secondary text-black text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
                           <CheckCircle2Icon className="w-4 h-4"/> Salvar Ciclo
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};


export default CriarCicloModal;