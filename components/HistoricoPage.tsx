import React, { useEffect, useState, useMemo } from "react"
import { useHistoricoStore, HistoricoItem } from "../stores/useHistoricoStore"
import { useEditalStore } from "../stores/useEditalStore"
import { useDisciplinasStore } from "../stores/useDisciplinasStore"
import { HistoricoService } from "../services/support/HistoricoService"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Skeleton } from "./ui/Skeleton"
import Input from "./ui/Input"
import {
  Clock,
  BookOpen,
  TrendingUp,
  Target,
  BarChart3,
  Trophy,
  Flame,
  Zap,
  Star,
  Bell,
  X,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Save,
  ChevronLeft,
  ChevronRight,
  History,
  Filter,
  CalendarDays
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useUnifiedStreak } from "../utils/unifiedStreakCalculator"
import { useDailyGoalStore } from "../stores/useDailyGoalStore"
import CollapsedFilterSection from "./CollapsedFilterSection"
import HistoryDayGroup from "./HistoryDayGroup"
import { limparComentariosParaExibicao, mesclarComentariosComMarcadores } from "../utils/cicloSessions"

interface HistoricoPageProps {
  setActiveView: (view: string) => void;
}

const LoadingList: React.FC = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 animate-pulse">
        <div className="h-10 w-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-muted rounded" />
          <div className="h-3 w-1/4 bg-muted rounded" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-4 rounded-full bg-muted/30 mb-4">
      <History className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground">
      Nenhum registro encontrado
    </h3>
    <p className="mt-1 text-sm text-muted-foreground max-w-xs">
      Tente ajustar os filtros ou comece a estudar para ver seu histórico aqui.
    </p>
  </div>
);

// ... (AnaliseSemanal, EditModal, etc. remain mostly the same, just updating icons to lucide-react)
// I will keep the logic components but update the main render

const AnaliseSemanal: React.FC<{ historico: HistoricoItem[] }> = ({ historico }) => {
  const dados = useMemo(() => {
    const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hoje = new Date();
    const dias = Array.from({ length: 7 }, (_, i) => { const d = new Date(hoje); d.setDate(d.getDate() - i); return d; }).reverse();

    return dias.map(d => {
      const minutos = historico
        .filter(item => {
          const [ano, mes, dia] = item.data.split('-').map(Number)
          const dataItem = new Date(ano, mes - 1, dia)
          return dataItem.toDateString() === d.toDateString()
        })
        .reduce((acc, i) => acc + (i.duracao_minutos || 0), 0);
      return { name: diasDaSemana[d.getDay()], minutos };
    });
  }, [historico]);

  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Análise Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
            <XAxis dataKey="name" className="text-xs font-medium" tick={{ fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--color-muted)/20' }}
              contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="minutos" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// ... (EditModal implementation - keeping it concise for this update, assuming it's largely unchanged logic-wise but using new icons)
interface EditModalProps {
  registro: HistoricoItem;
  onSave: (updatedData: any) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ registro, onSave, onCancel, isSaving }) => {
  const comentariosLimpos = limparComentariosParaExibicao(registro.comentarios);
  const { disciplinas } = useDisciplinasStore();

  // Encontrar a disciplina e tópico atuais baseado nos nomes
  const initialDisciplina = disciplinas.find(d => d.nome === registro.disciplina);
  const initialTopico = initialDisciplina?.topicos.find(t => t.titulo === registro.topico);

  const [formData, setFormData] = useState({
    ...registro,
    comentarios: comentariosLimpos,
    disciplina_id: initialDisciplina?.id || '',
    topico_id: initialTopico?.id || ''
  });
  const comentariosOriginais = registro.comentarios;

  // Tópicos filtrados baseado na disciplina selecionada
  const topicosFiltrados = useMemo(() => {
    const disc = disciplinas.find(d => d.id === formData.disciplina_id);
    return disc?.topicos || [];
  }, [disciplinas, formData.disciplina_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';

    if (name === 'disciplina_id') {
      // Quando mudar disciplina, resetar tópico
      const novaDisciplina = disciplinas.find(d => d.id === value);
      setFormData(prev => ({
        ...prev,
        disciplina_id: value,
        disciplina: novaDisciplina?.nome || '',
        topico_id: '',
        topico: ''
      }));
    } else if (name === 'topico_id') {
      const disciplinaAtual = disciplinas.find(d => d.id === formData.disciplina_id);
      const novoTopico = disciplinaAtual?.topicos.find(t => t.id === value);
      setFormData(prev => ({
        ...prev,
        topico_id: value,
        topico: novoTopico?.titulo || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: isNumber ? Number(value) : value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dadosParaSalvar = {
      ...formData,
      comentarios: mesclarComentariosComMarcadores(
        formData.comentarios || '',
        comentariosOriginais
      )
    };
    onSave(dadosParaSalvar);
  };

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <Card className="relative bg-card border-border shadow-2xl max-w-lg w-full">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-foreground">Editar Registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
            {formData.type === 'estudo' && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Disciplina</label>
                  <select
                    name="disciplina_id"
                    value={formData.disciplina_id}
                    onChange={handleChange}
                    className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Selecione uma disciplina</option>
                    {disciplinas.map(d => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Tópico</label>
                  <select
                    name="topico_id"
                    value={formData.topico_id}
                    onChange={handleChange}
                    disabled={!formData.disciplina_id}
                    className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecione um tópico</option>
                    {topicosFiltrados.map(t => (
                      <option key={t.id} value={t.id} title={t.titulo}>
                        {t.titulo.length > 50 ? t.titulo.substring(0, 50) + '...' : t.titulo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Duração (minutos)</label>
                  <Input type="number" name="duracao_minutos" value={formData.duracao_minutos} onChange={handleChange} className="bg-background text-foreground border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Comentários</label>
                  <textarea
                    name="comentarios"
                    value={formData.comentarios || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </>
            )}
            {formData.type === 'simulado' && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Nome do Simulado</label>
                  <Input name="nome" value={formData.nome} onChange={handleChange} className="bg-background text-foreground border-border" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Acertos</label>
                    <Input type="number" name="acertos" value={formData.acertos} onChange={handleChange} className="bg-background text-foreground border-border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Erros</label>
                    <Input type="number" name="erros" value={formData.erros} onChange={handleChange} className="bg-background text-foreground border-border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Brancos</label>
                    <Input type="number" name="brancos" value={formData.brancos} onChange={handleChange} className="bg-background text-foreground border-border" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Duração (minutos)</label>
                  <Input type="number" name="duracao_minutos" value={formData.duracao_minutos} onChange={handleChange} className="bg-background text-foreground border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Comentários</label>
                  <textarea
                    name="comentarios"
                    value={formData.comentarios || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </>
            )}
          </CardContent>
          <div className="flex justify-end gap-3 p-4 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 border border-border rounded-lg font-semibold text-foreground bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default function HistoricoPage({ setActiveView }: HistoricoPageProps) {
  const { historico, fetchHistorico, loading } = useHistoricoStore()
  const { editalAtivo } = useEditalStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOrigem, setFilterOrigem] = useState("all")
  const [filterData, setFilterData] = useState("all")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const metaDiaria = useDailyGoalStore((state) => state.goalMinutes)
  const setMetaDiaria = useDailyGoalStore((state) => state.setGoalMinutes)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string; type: 'estudo' | 'simulado' | null }>({
    isOpen: false,
    id: null,
    name: '',
    type: null,
  })
  const [editModal, setEditModal] = useState<{ isOpen: boolean; registro: HistoricoItem | null }>({
    isOpen: false,
    registro: null
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (editalAtivo?.id) {
      fetchHistorico(editalAtivo.id)
    }
  }, [editalAtivo?.id, fetchHistorico])

  // ... (Keep existing useEffect for notifications)
  useEffect(() => {
    const checkMeta = () => {
      const hoje = new Date()
      const dataHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

      const tempoHoje = historico
        .filter(item => {
          const [ano, mes, dia] = item.data.split('-').map(Number)
          const dataItem = new Date(ano, mes - 1, dia)
          const dataNormalizada = new Date(dataItem.getFullYear(), dataItem.getMonth(), dataItem.getDate())
          return dataNormalizada.getTime() === dataHoje.getTime()
        })
        .reduce((acc, item) => acc + (item.duracao_minutos || 0), 0)

      const percentual = metaDiaria > 0 ? (tempoHoje / metaDiaria) * 100 : 0;
      const hora = hoje.getHours()

      if (hora === 12 && percentual < 30 && tempoHoje < 60) {
        setNotificationMessage(`⏰ Lembrete: Você ainda não estudou hoje! Meta: ${metaDiaria / 60}h`)
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 5000)
      }

      if (hora === 18 && percentual < 60) {
        const faltam = metaDiaria - tempoHoje
        setNotificationMessage(`🔔 Atenção: Faltam ${Math.floor(faltam / 60)}h ${faltam % 60}min para sua meta!`)
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 5000)
      }
    }

    const interval = setInterval(checkMeta, 60000)
    checkMeta()

    return () => clearInterval(interval)
  }, [historico, metaDiaria])

  const historicoFiltrado = historico.filter(item => {
    if (!item.duracao_minutos || item.duracao_minutos <= 0) {
      return false
    }

    const matchSearch = item.type === 'estudo'
      ? item.disciplina?.toLowerCase().includes(searchTerm.toLowerCase()) || item.topico?.toLowerCase().includes(searchTerm.toLowerCase())
      : item.nome?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchOrigem = filterOrigem === "all" || item.origem === filterOrigem || (filterOrigem === 'simulado' && item.type === 'simulado')

    let matchData = true
    if (filterData !== "all") {
      const [ano, mes, dia] = item.data.split('-').map(Number)
      const itemData = new Date(ano, mes - 1, dia)
      itemData.setHours(0, 0, 0, 0)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      switch (filterData) {
        case "hoje":
          matchData = itemData.getTime() === hoje.getTime()
          break
        case "7dias":
          const data7Dias = new Date(hoje)
          data7Dias.setDate(data7Dias.getDate() - 7)
          matchData = itemData >= data7Dias
          break
        case "30dias":
          const data30Dias = new Date(hoje)
          data30Dias.setDate(data30Dias.getDate() - 30)
          matchData = itemData >= data30Dias
          break
        case "custom":
          if (dataInicio && dataFim) {
            const [anoInicio, mesInicio, diaInicio] = dataInicio.split('-').map(Number)
            const [anoFim, mesFim, diaFim] = dataFim.split('-').map(Number)
            const inicio = new Date(anoInicio, mesInicio - 1, diaInicio)
            const fim = new Date(anoFim, mesFim - 1, diaFim)
            fim.setHours(23, 59, 59, 999)
            matchData = itemData >= inicio && itemData <= fim
          }
          break
      }
    }

    return matchSearch && matchOrigem && matchData
  })

  const handleDeleteClick = (id: string, type: 'estudo' | 'simulado', name: string) => {
    setDeleteModal({ isOpen: true, id, name, type });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.id || !deleteModal.type) return
    setIsDeleting(true)
    try {
      await HistoricoService.delete(deleteModal.id, deleteModal.type);
      if (editalAtivo?.id) {
        fetchHistorico(editalAtivo.id);
      }
      setDeleteModal({ isOpen: false, id: null, name: '', type: null });
      setNotificationMessage('✅ Registro excluído com sucesso!')
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    } catch (error) {
      console.error('Erro ao deletar:', error)
      setNotificationMessage('❌ Erro ao excluir registro')
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, id: null, name: '', type: null })
  }

  const handleEditClick = (registro: HistoricoItem) => {
    setEditModal({ isOpen: true, registro: { ...registro } })
  }

  const handleEditSave = async (updatedData: any) => {
    if (!editModal.registro?.id) return
    setIsSaving(true)
    try {
      await HistoricoService.update(editModal.registro.id, editModal.registro.type, updatedData);
      if (editalAtivo?.id) {
        fetchHistorico(editalAtivo.id);
      }
      setEditModal({ isOpen: false, registro: null })
      setNotificationMessage('✅ Registro atualizado com sucesso!')
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      setNotificationMessage('❌ Erro ao atualizar registro')
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCancel = () => {
    setEditModal({ isOpen: false, registro: null })
  }

  const historicoAgrupado = useMemo(() => {
    const grupos = historicoFiltrado.reduce((acc, item) => {
      const dataKey = item.data.split('T')[0];
      if (!acc[dataKey]) acc[dataKey] = [];
      acc[dataKey].push(item);
      return acc;
    }, {} as Record<string, HistoricoItem[]>);

    return Object.keys(grupos)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(data => ({ data, items: grupos[data] }));
  }, [historicoFiltrado]);

  return (
    <div data-tutorial="historico-content" className="min-h-screen space-y-8 pb-10">
      {showNotification && (
        <div className="fixed top-4 right-4 z-[101] animate-in slide-in-from-top-5">
          <Card className="border border-primary bg-card shadow-2xl max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {notificationMessage}
                  </p>
                </div>
                <button
                  onClick={() => setShowNotification(false)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header Section with Glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/50 shadow-sm backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-2">
              <History className="w-4 h-4" />
              Histórico de Atividades
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Sua Jornada de Estudos
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Acompanhe cada passo do seu progresso. Visualize suas sessões, simulados e mantenha a constância.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Card className="bg-background/50 backdrop-blur border-border shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Tempo Total</p>
                  <p className="text-lg font-bold text-foreground">
                    {Math.round(historico.reduce((acc, h) => acc + (h.duracao_minutos || 0), 0) / 60)}h
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50 backdrop-blur border-border shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Atividades</p>
                  <p className="text-lg font-bold text-foreground">
                    {historico.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: History Timeline */}
        <div className="lg:col-span-2 space-y-6">

          {/* Filters */}
          <CollapsedFilterSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterOrigem={filterOrigem}
            setFilterOrigem={setFilterOrigem}
            filterData={filterData}
            setFilterData={setFilterData}
            dataInicio={dataInicio}
            setDataInicio={setDataInicio}
            dataFim={dataFim}
            setDataFim={setDataFim}
          />

          {/* History List */}
          <div className="space-y-8">
            {loading ? (
              <LoadingList />
            ) : historicoFiltrado.length ? (
              historicoAgrupado.map(({ data, items }) => {
                const hoje = new Date();
                const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
                const isToday = data === hojeStr;

                return (
                  <HistoryDayGroup
                    key={data}
                    data={data}
                    items={items}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    isToday={isToday}
                    allHistorico={historico}
                  />
                );
              })
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        {/* Sidebar: Stats & Goals */}
        <div className="space-y-6">
          <MetaDiaria historico={historico} meta={metaDiaria} setMeta={setMetaDiaria} />
          <AnaliseSemanal historico={historico} />
          <ConquistasCarousel historico={historico} />

          <Card className="border-border shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Análise Profunda</h4>
                    <p className="text-xs text-muted-foreground">Veja gráficos detalhados</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveView('estatisticas')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Ver Estatísticas Completas
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleDeleteCancel} />
          <Card className="relative bg-card shadow-2xl max-w-md w-full border-red-500/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-red-500/10">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    Confirmar Exclusão
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tem certeza que deseja excluir o registro de:
                  </p>
                  <p className="text-sm font-semibold text-foreground mb-4">
                    {deleteModal.name}
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
                <button
                  onClick={handleDeleteCancel}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-border rounded-lg font-semibold text-muted-foreground hover:bg-muted transition-all duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editModal.isOpen && editModal.registro && (
        <EditModal
          registro={editModal.registro}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}

// Helper Components (MetaDiaria, ConquistasCarousel) - kept mostly same but with Lucide icons
function MetaDiaria({ historico, meta, setMeta }: { historico: HistoricoItem[], meta: number, setMeta: (m: number) => void }) {
  const tempoHoje = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return historico.filter(item => {
      const [ano, mes, dia] = item.data.split('-').map(Number);
      const dataItem = new Date(ano, mes - 1, dia);
      dataItem.setHours(0, 0, 0, 0);
      return dataItem.getTime() === hoje.getTime();
    }).reduce((acc, item) => acc + (item.duracao_minutos || 0), 0);
  }, [historico]);
  const percentual = meta > 0 ? Math.round((tempoHoje / meta) * 100) : 0;
  const faltam = Math.max(meta - tempoHoje, 0);
  const formatarTempo = (minutos: number) => { const h = Math.floor(minutos / 60); const m = minutos % 60; return h > 0 ? `${h}h ${m}min` : `${m}min`; };

  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-all">
      <CardHeader className="bg-primary/5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Target className="h-5 w-5 text-primary" /></div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">Meta Diária</CardTitle>
            </div>
          </div>
          <select value={meta} onChange={(e) => setMeta(Number(e.target.value))} className="px-2 py-1 rounded-md border border-border bg-card text-xs font-medium text-foreground">
            {[60, 90, 120, 150, 180, 240, 300].map(m => <option key={m} value={m}>{formatarTempo(m)}</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between mb-2"><span className="text-2xl font-bold text-foreground">{formatarTempo(tempoHoje)}</span><span className="text-xs font-semibold text-muted-foreground self-end mb-1">/ {formatarTempo(meta)}</span></div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 rounded-full ${percentual >= 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${Math.min(percentual, 100)}%` }} /></div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{percentual}%</span>
          <span>{percentual >= 100 ? 'Meta batida! 🚀' : `Faltam ${formatarTempo(faltam)}`}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ConquistasCarousel({ historico }: { historico: HistoricoItem[] }) {
  const unifiedStreak = useUnifiedStreak();
  const [currentIndex, setCurrentIndex] = useState(0);

  const conquistas = useMemo(() => {
    if (!historico || !Array.isArray(historico)) return { streakAtual: 0, totalHoras: 0, totalSessoes: 0 };
    return {
      streakAtual: unifiedStreak.streak,
      totalHoras: Math.floor(historico.reduce((acc, item) => acc + (item.duracao_minutos || 0), 0) / 60),
      totalSessoes: historico.length
    };
  }, [historico, unifiedStreak.streak]);

  const badges = [
    { id: 'streak', icon: Flame, titulo: `${conquistas.streakAtual} Dias`, desc: `Sequência atual`, conquistado: conquistas.streakAtual >= 3, color: 'text-orange-500' },
    { id: 'horas', icon: Trophy, titulo: `${conquistas.totalHoras}h Totais`, desc: `Tempo estudado`, conquistado: conquistas.totalHoras >= 10, color: 'text-yellow-500' },
    { id: 'sessoes', icon: Zap, titulo: `${conquistas.totalSessoes} Sessões`, desc: `Total atividades`, conquistado: conquistas.totalSessoes >= 10, color: 'text-purple-500' },
    { id: 'consistencia', icon: Star, titulo: 'Consistente', desc: '7 dias seguidos', conquistado: unifiedStreak.streak >= 7, color: 'text-blue-500' }
  ];

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % badges.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + badges.length) % badges.length);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground">Conquistas</CardTitle>
          <div className="flex gap-1">
            <button onClick={prevSlide} className="p-1 rounded hover:bg-muted"><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={nextSlide} className="p-1 rounded hover:bg-muted"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden">
          <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.id} className="min-w-full px-1">
                  <div className={`p-3 rounded-xl border flex items-center gap-3 ${b.conquistado ? 'bg-card border-border' : 'bg-muted/30 border-transparent opacity-60'}`}>
                    <div className={`p-2 rounded-full bg-background shadow-sm ${b.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{b.titulo}</p>
                      <p className="text-xs text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}