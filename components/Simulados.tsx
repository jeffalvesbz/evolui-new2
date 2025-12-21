import React, { useState, useMemo, useEffect } from 'react'
import { SaveIcon, EditIcon, PlayCircleIcon, PlusCircleIcon, Trash2Icon } from './icons'
import { toast } from './Sonner'
import { useStudyStore, Simulation } from '../stores/useStudyStore'
import { useEditalStore } from '../stores/useEditalStore'
import { Modal } from './ui/BaseModal'

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Simulados = () => {
  const { editalAtivo } = useEditalStore()
  const simulados = useStudyStore((state) => state.simulations)
  const addSimulation = useStudyStore((state) => state.addSimulation)
  const updateSimulation = useStudyStore((state) => state.updateSimulation)
  const deleteSimulation = useStudyStore((state) => state.deleteSimulation)
  const fetchSimulados = useStudyStore((state) => state.fetchSimulados)

  const simuladosFiltrados = useMemo(() => {
    if (!simulados || simulados.length === 0) return []
    if (!editalAtivo?.id) {
      return simulados
    }
    return simulados.filter(s => s.studyPlanId === editalAtivo.id)
  }, [simulados, editalAtivo?.id])

  const [form, setForm] = useState({
    name: '', correct: 0, wrong: 0, blank: 0, durationMinutes: 0, notes: '', date: getTodayDateString(), isCebraspe: false
  })
  const [editingSimulation, setEditingSimulation] = useState<Simulation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Simulation | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Garantir que os simulados sejam carregados quando o componente é montado ou quando o edital muda
  useEffect(() => {
    if (editalAtivo?.id) {
      fetchSimulados(editalAtivo.id).catch(err => {
        console.error("Erro ao carregar simulados:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editalAtivo?.id]);

  const resetForm = () => {
    setForm({ name: '', correct: 0, wrong: 0, blank: 0, durationMinutes: 0, notes: '', date: getTodayDateString(), isCebraspe: false })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !editalAtivo?.id || !form.date) {
      toast.error('Preencha o nome, a data e selecione um edital.')
      return
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      correct: Number(form.correct),
      wrong: Number(form.wrong),
      blank: Number(form.blank),
      durationMinutes: Number(form.durationMinutes),
      date: form.date, // Envia a data como 'YYYY-MM-DD' para ser interpretada como UTC pelo DB
      isCebraspe: form.isCebraspe,
    };

    try {
      if (editingSimulation) {
        await updateSimulation(editingSimulation.id, payload);
        toast.success('Simulado atualizado com sucesso!');
        setEditingSimulation(null);
      } else {
        await addSimulation(payload);
        toast.success('Simulado registrado!');
      }
      resetForm();
      setIsCreateOpen(false);
    } catch (error) {
      toast.error('Não foi possível salvar o simulado.');
    }
  }

  const openEdit = (simulation: Simulation) => {
    setEditingSimulation(simulation)
    setForm({
      name: simulation.name, correct: simulation.correct, wrong: simulation.wrong,
      blank: simulation.blank || 0, durationMinutes: simulation.durationMinutes,
      notes: simulation.notes ?? '',
      // Converte a data ISO para YYYY-MM-DD, tratando como UTC para evitar erros de fuso
      date: simulation.date ? new Date(simulation.date).toLocaleDateString('en-CA', { timeZone: 'UTC' }) : getTodayDateString(),
      isCebraspe: simulation.isCebraspe ?? false,
    })
    setIsCreateOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateOpen(false);
    setEditingSimulation(null);
  }

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteSimulation(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Simulado excluído.');
    }
  }

  return (
    <div data-tutorial="simulados-content" className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Simulados</h2>
            <p className="text-sm text-muted-foreground">Acompanhe acertos, erros e evolução da sua preparação.</p>
          </div>
          <button type="button" onClick={() => { resetForm(); setEditingSimulation(null); setIsCreateOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
            <PlusCircleIcon className="h-4 w-4" /> Adicionar simulado
          </button>
        </header>
        <div className="mt-6 grid gap-4">
          {simuladosFiltrados.length > 0 ? (
            simuladosFiltrados.map((simulation) => {
              const totalQuestions = simulation.correct + simulation.wrong + (simulation.blank ?? 0);
              let scoreDisplay: number | string;
              let scoreLabel: string;
              let scoreClass: string;

              if (simulation.isCebraspe) {
                const netScore = simulation.correct - simulation.wrong;
                scoreDisplay = netScore;
                scoreLabel = 'Pontos Líquidos';
                scoreClass = 'bg-yellow-500/20 text-yellow-400';
              } else {
                scoreDisplay = totalQuestions ? Math.round((simulation.correct / totalQuestions) * 100) : 0;
                scoreLabel = '% de acertos';
                scoreClass = 'bg-secondary/20 text-secondary';
              }

              return (
                <article key={simulation.id} className="rounded-xl border border-border bg-background p-5 text-sm text-card-foreground shadow-sm transition hover:border-primary/60">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        {simulation.name}
                        {simulation.isCebraspe && <span className="text-xs font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Cebraspe</span>}
                      </h3>
                      <p className="text-xs text-muted-foreground">{new Date(simulation.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} • {simulation.durationMinutes} min</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${scoreClass}`}>
                        {scoreDisplay}{!simulation.isCebraspe && '%'} {scoreLabel}
                      </span>
                      <button type="button" onClick={() => openEdit(simulation)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent bg-muted text-muted-foreground transition hover:border-primary hover:text-primary"><EditIcon className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setDeleteTarget(simulation)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent bg-muted text-muted-foreground transition hover:border-red-500 hover:text-red-500"><Trash2Icon className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-xs sm:grid-cols-4">
                    <span className="rounded-lg bg-blue-500/20 px-3 py-2 text-center font-bold text-blue-400">Acertos: {simulation.correct}</span>
                    <span className="rounded-lg bg-red-500/20 px-3 py-2 text-center font-bold text-red-400">Erros: {simulation.wrong}</span>
                    <span className="rounded-lg bg-yellow-500/20 px-3 py-2 text-center font-bold text-yellow-400">Brancos: {simulation.blank}</span>
                    <span className="rounded-lg bg-muted/50 px-3 py-2 text-center font-bold text-foreground">Questões: {totalQuestions}</span>
                  </div>
                  {simulation.notes && <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{simulation.notes}</p>}
                </article>
              )
            })
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
              {editalAtivo?.id ? "Nenhum simulado registrado. Clique em 'Adicionar simulado'." : "Selecione um edital para ver os simulados."}
            </div>
          )}
        </div>
      </section>

      {/* Modal de Criar/Editar Simulado */}
      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreateModal}
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[95vh]">
          <Modal.Header onClose={handleCloseCreateModal}>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{editingSimulation ? 'Editar' : 'Registrar'} Simulado</h2>
              <p className="text-xs text-muted-foreground">Preencha os resultados para acompanhar seu desempenho.</p>
            </div>
          </Modal.Header>

          <Modal.Body className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs font-semibold text-foreground">Nome</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="rounded-lg border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </label>

              <label className="flex items-center gap-2 text-sm md:col-span-2 text-foreground">
                <input
                  type="checkbox"
                  checked={form.isCebraspe}
                  onChange={e => setForm(p => ({ ...p, isCebraspe: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary bg-background border-border focus:ring-2 focus:ring-primary focus:ring-offset-0"
                />
                Estilo Cebraspe (uma errada anula uma certa)
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground">Acertos</span>
                <input
                  type="number"
                  min="0"
                  value={form.correct}
                  onChange={e => setForm(p => ({ ...p, correct: Number(e.target.value) }))}
                  className="rounded-lg border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground">Erros</span>
                <input
                  type="number"
                  min="0"
                  value={form.wrong}
                  onChange={e => setForm(p => ({ ...p, wrong: Number(e.target.value) }))}
                  className="rounded-lg border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground">Em Branco</span>
                <input
                  type="number"
                  min="0"
                  value={form.blank}
                  onChange={e => setForm(p => ({ ...p, blank: Number(e.target.value) }))}
                  className="rounded-lg border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground">Duração (min)</span>
                <input
                  type="number"
                  min="0"
                  value={form.durationMinutes}
                  onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
                  className="rounded-lg border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground">Data</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="rounded-lg border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs font-semibold text-foreground">Observações</span>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="rounded-lg border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </label>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <button
              type="button"
              onClick={handleCloseCreateModal}
              className="h-9 px-4 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 transition-colors"
            >
              <SaveIcon className="w-4 h-4" /> Salvar
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        size="sm"
      >
        <Modal.Header onClose={() => setDeleteTarget(null)}>
          <h3 className="text-lg font-semibold">Excluir Simulado</h3>
        </Modal.Header>

        <Modal.Body>
          <p className="text-sm text-muted-foreground">
            Tem certeza que quer excluir "{deleteTarget?.name}"? Esta ação é irreversível.
          </p>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="h-9 px-4 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            className="h-9 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Excluir
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Simulados;