import React, { useEffect, useState, useMemo } from "react"
import { useHistoricoStore, HistoricoItem } from "../stores/useHistoricoStore"
import { useEditalStore } from "../stores/useEditalStore"
import { HistoricoService } from "../services/support/HistoricoService"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Skeleton } from "./ui/Skeleton"
import Input from "./ui/Input"
import { SearchIcon, ClockIcon, BookOpenIcon, CalendarDaysIcon, TrendingUpIcon, FilterIcon, TargetIcon, BarChart3Icon, TrophyIcon, FlameIcon, ZapIcon, StarIcon, CheckCircle2Icon, BellIcon, XIcon, Trash2Icon, AlertTriangleIcon, ArrowRightIcon, EditIcon, FileTextIcon } from "./icons"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useUnifiedStreak } from "../utils/unifiedStreakCalculator"
import { useDailyGoalStore } from "../stores/useDailyGoalStore"

interface HistoricoPageProps {
  setActiveView: (view: string) => void;
}

export default function HistoricoPage({ setActiveView }: HistoricoPageProps) {
  const { historico, fetchHistorico, loading } = useHistoricoStore()
  const { editalAtivo } = useEditalStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOrigem, setFilterOrigem] = useState("all")
  const [filterData, setFilterData] = useState("all") // 'all', 'hoje', '7dias', '30dias', 'custom'
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

  useEffect(() => {
    const handleHistoricoUpdate = () => {
      if (editalAtivo?.id) {
        fetchHistorico(editalAtivo.id)
      }
    }

    window.addEventListener('historico:updated', handleHistoricoUpdate)
    return () => window.removeEventListener('historico:updated', handleHistoricoUpdate)
  }, [editalAtivo?.id, fetchHistorico])

  useEffect(() => {
    const checkMeta = () => {
      const hoje = new Date()
      const dataHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      
      const tempoHoje = historico
        .filter(item => {
          const dataItem = new Date(`${item.data}T00:00:00`)
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
      const itemData = new Date(`${item.data}T00:00:00`);
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      switch (filterData) {
        case "hoje":
          matchData = itemData.toDateString() === hoje.toDateString()
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
            const inicio = new Date(`${dataInicio}T00:00:00`);
            const fim = new Date(`${dataFim}T00:00:00`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/50 transition-colors duration-300">
      {showNotification && (
        <div className="fixed top-4 right-4 z-[101] animate-in slide-in-from-top-5">
          <Card className="border border-primary bg-card shadow-2xl max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BellIcon className="h-5 w-5 text-primary" />
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
                  <XIcon className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-10 py-6 md:py-10 space-y-6">
        <Header />
        
        <Card className="border-border shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3Icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Ver análise detalhada dos estudos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Acesse gráficos, insights inteligentes e análise de desempenho
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveView('estatisticas')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Ver Estatísticas
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Filters 
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
        <Stats historico={historicoFiltrado} />

        <MetaDiaria historico={historico} meta={metaDiaria} setMeta={setMetaDiaria} />

        <ConquistasEBadges historico={historico} />

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">
              Histórico de Atividades
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {historicoFiltrado.length} {historicoFiltrado.length === 1 ? 'registro encontrado' : 'registros encontrados'}
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingList />
            ) : historicoFiltrado.length ? (
              <HistoricoList 
                historico={historicoFiltrado} 
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        <HeatMapCalendario historico={historico} />

        <div className="grid gap-6 lg:grid-cols-2">
          <GraficoProgresso historico={historico} />
          <AnaliseSemanal historico={historico} />
        </div>
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleDeleteCancel} />
          <Card className="relative bg-card shadow-2xl max-w-md w-full border-red-500/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-red-500/10">
                  <AlertTriangleIcon className="h-6 w-6 text-red-500" />
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
                  <XIcon className="h-4 w-4 text-muted-foreground" />
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
                      <Trash2Icon className="w-4 h-4" />
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

function Header() {
  return (
    <Card className="border-border bg-card shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  <BookOpenIcon className="h-4 w-4 text-primary" />
                  Histórico
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  Histórico de Atividades
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Acompanhe seu progresso e todas as suas sessões de estudo e simulados.
                </p>
            </div>
        </div>
      </CardHeader>
    </Card>
  )
}

interface FiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterOrigem: string
  setFilterOrigem: (origem: string) => void
  filterData: string
  setFilterData: (data: string) => void
  dataInicio: string
  setDataInicio: (data: string) => void
  dataFim: string
  setDataFim: (data: string) => void
}

function Filters({ searchTerm, setSearchTerm, filterOrigem, setFilterOrigem, filterData, setFilterData, dataInicio, setDataInicio, dataFim, setDataFim }: FiltersProps) {
  return (
    <Card className="border-border shadow-md">
      <CardContent className="pt-6 space-y-4">
        <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por disciplina, tópico ou simulado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FilterIcon className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-semibold text-foreground">Tipo:</label>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'manual', 'timer', 'ciclo_estudos', 'simulado'].map(origem => (
              <button
                key={origem}
                onClick={() => setFilterOrigem(origem)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${filterOrigem === origem ? "bg-primary text-primary-foreground shadow-md" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
              >
                {origem === 'all' ? 'Todos' : origem === 'ciclo_estudos' ? 'Ciclo' : origem.charAt(0).toUpperCase() + origem.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDaysIcon className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-semibold text-foreground">Período:</label>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-wrap">
              {['all', 'hoje', '7dias', '30dias', 'custom'].map(periodo => (
                <button
                  key={periodo}
                  onClick={() => setFilterData(periodo)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${filterData === periodo ? "bg-primary text-primary-foreground shadow-md" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                >
                  {periodo === 'all' ? 'Tudo' : periodo === '7dias' ? '7 dias' : periodo === '30dias' ? '30 dias' : periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                </button>
              ))}
            </div>
            {filterData === "custom" && (
              <div className="flex gap-2 items-center flex-wrap">
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-40" />
                <span className="text-muted-foreground">até</span>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-40" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Stats({ historico }: { historico: HistoricoItem[] }) {
  const totalMin = historico.reduce((acc, h) => acc + (h.duracao_minutos || 0), 0)
  const totalSessions = historico.length
  const avg = totalSessions ? (totalMin / totalSessions).toFixed(1) : "0"
  const formatarTempo = (minutos: number) => { const h = Math.floor(minutos / 60); const m = minutos % 60; return `${h}h ${m}min` }
  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <Card className="border-border shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground">Tempo Total</CardTitle><ClockIcon className="h-5 w-5 text-secondary" /></CardHeader>
        <CardContent><div className="text-3xl font-bold text-foreground">{formatarTempo(totalMin)}</div></CardContent>
      </Card>
      <Card className="border-border shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground">Atividades</CardTitle><BookOpenIcon className="h-5 w-5 text-primary" /></CardHeader>
        <CardContent><div className="text-3xl font-bold text-foreground">{totalSessions}</div></CardContent>
      </Card>
      <Card className="border-border shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground">Média</CardTitle><TrendingUpIcon className="h-5 w-5 text-yellow-500" /></CardHeader>
        <CardContent><div className="text-3xl font-bold text-foreground">{avg} min</div></CardContent>
      </Card>
    </div>
  )
}

function HistoricoList({ historico, onEdit, onDelete }: { historico: HistoricoItem[], onEdit: (r: HistoricoItem) => void, onDelete: (id: string, type: 'estudo' | 'simulado', name: string) => void }) {
  const formatDataCompleta = (data: string) => {
    // new Date('YYYY-MM-DD') is parsed as UTC, causing off-by-one errors.
    // Appending time makes it parse in the local timezone.
    const date = new Date(`${data}T00:00:00`);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    if (date.toDateString() === hoje.toDateString()) return 'Hoje';
    if (date.toDateString() === ontem.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  }
  const formatarTempo = (minutos: number) => { const h = Math.floor(minutos / 60); const m = minutos % 60; return h > 0 ? `${h}h ${m}min` : `${m}min`; }
  const getOrigemBadge = (origem: string | undefined) => {
    const badges = { manual: "bg-blue-500/10 text-blue-400", timer: "bg-purple-500/10 text-purple-400", ciclo_estudos: "bg-green-500/10 text-green-400" };
    return badges[origem as keyof typeof badges] || badges.manual;
  }
  const historicoAgrupado = historico.reduce((acc, item) => {
    const dataKey = item.data.split('T')[0];
    if (!acc[dataKey]) acc[dataKey] = [];
    acc[dataKey].push(item);
    return acc;
  }, {} as Record<string, HistoricoItem[]>);
  const datasOrdenadas = Object.keys(historicoAgrupado).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6">
      {datasOrdenadas.map((data) => {
        const itensDoDia = historicoAgrupado[data];
        const tempoTotalDia = itensDoDia.reduce((acc, item) => acc + (item.duracao_minutos || 0), 0);
        return (
          <div key={data} className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><CalendarDaysIcon className="w-4 h-4 text-primary" /></div>
                <div>
                  <h3 className="text-lg font-bold text-foreground capitalize">{formatDataCompleta(data)}</h3>
                  <p className="text-xs text-muted-foreground">{itensDoDia.length} {itensDoDia.length === 1 ? 'atividade' : 'atividades'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                <ClockIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">{formatarTempo(tempoTotalDia)}</span>
              </div>
            </div>
            <div className="grid gap-3">
              {itensDoDia.map((item) => (
                <Card key={item.id} className="p-4 hover:shadow-md transition-all border-border bg-card/50 group">
                  {item.type === 'estudo' ? (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-lg text-foreground">{item.disciplina}</p>
                        <p className="text-sm text-muted-foreground">{item.topico || 'Sem tópico'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                          <div className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-muted-foreground" /><span className="text-lg font-bold text-foreground">{formatarTempo(item.duracao_minutos)}</span></div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${getOrigemBadge(item.origem)}`}>{item.origem === 'ciclo_estudos' ? 'Ciclo' : item.origem?.charAt(0).toUpperCase() + item.origem?.slice(1)}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(item)} className="p-2 rounded-lg text-primary hover:bg-primary/10" title="Editar"><EditIcon className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(item.id, 'estudo', item.disciplina || 'Estudo')} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" title="Excluir"><Trash2Icon className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ) : ( // Simulado
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileTextIcon className="w-4 h-4 text-secondary"/>
                            <p className="font-semibold text-lg text-foreground">{item.nome}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">Simulado</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                            <div className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-muted-foreground" /><span className="text-lg font-bold text-foreground">{formatarTempo(item.duracao_minutos)}</span></div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-secondary/20 text-secondary">{item.precisao}% Acertos</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(item)} className="p-2 rounded-lg text-primary hover:bg-primary/10" title="Editar"><EditIcon className="w-4 h-4" /></button>
                            <button onClick={() => onDelete(item.id, 'simulado', item.nome || 'Simulado')} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" title="Excluir"><Trash2Icon className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border text-xs grid grid-cols-3 gap-2 text-center">
                        <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded font-semibold">Acertos: {item.acertos}</div>
                        <div className="p-1.5 bg-red-500/10 text-red-400 rounded font-semibold">Erros: {item.erros}</div>
                        <div className="p-1.5 bg-yellow-500/10 text-yellow-400 rounded font-semibold">Brancos: {item.brancos}</div>
                      </div>
                    </>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MetaDiaria({ historico, meta, setMeta }: { historico: HistoricoItem[], meta: number, setMeta: (m: number) => void }) {
  const tempoHoje = useMemo(() => {
    const hoje = new Date();
    return historico.filter(item => new Date(`${item.data}T00:00:00`).toDateString() === hoje.toDateString()).reduce((acc, item) => acc + (item.duracao_minutos || 0), 0);
  }, [historico]);
  const percentual = meta > 0 ? Math.min(Math.round((tempoHoje / meta) * 100), 100) : 0;
  const faltam = Math.max(meta - tempoHoje, 0);
  const formatarTempo = (minutos: number) => { const h = Math.floor(minutos / 60); const m = minutos % 60; return h > 0 ? `${h}h ${m}min` : `${m}min`; };

  return (
    <Card className="border-border shadow-lg">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><TargetIcon className="h-5 w-5 text-primary" /></div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Meta Diária</CardTitle>
              <p className="text-sm text-muted-foreground">Acompanhe seu progresso de hoje</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Meta:</label>
            <select value={meta} onChange={(e) => setMeta(Number(e.target.value))} className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-semibold text-foreground">
              {[60,120,180,240,300,360].map(m => <option key={m} value={m}>{formatarTempo(m)}</option>)}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex justify-between mb-2"><span className="text-2xl font-bold text-foreground">{formatarTempo(tempoHoje)}</span><span className="text-sm font-semibold text-muted-foreground">de {formatarTempo(meta)}</span></div>
        <div className="relative h-4 bg-muted rounded-full"><div className={`h-full transition-all duration-500 rounded-full ${percentual >= 100 ? 'bg-secondary' : 'bg-primary'}`} style={{ width: `${percentual}%` }} /></div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground"><span>{percentual}% concluído</span><span>{faltam > 0 ? `Faltam ${formatarTempo(faltam)}` : '🎉 Meta atingida!'}</span></div>
      </CardContent>
    </Card>
  )
}

function ConquistasEBadges({ historico }: { historico: HistoricoItem[] }) {
  const unifiedStreak = useUnifiedStreak();
  const conquistas = useMemo(() => {
    if (!historico || !Array.isArray(historico)) return { streakAtual: 0, totalHoras: 0, totalSessoes: 0 };
    return {
      streakAtual: unifiedStreak.streak,
      totalHoras: Math.floor(historico.reduce((acc, item) => acc + (item.duracao_minutos || 0), 0) / 60),
      totalSessoes: historico.length
    };
  }, [historico, unifiedStreak.streak]);
  const badges = [
    { id: 'streak', icon: FlameIcon, titulo: `${conquistas.streakAtual} Dias de Fogo`, desc: `Streak atual de ${conquistas.streakAtual} dias`, conquistado: conquistas.streakAtual >= 3 },
    { id: 'horas', icon: TrophyIcon, titulo: `${conquistas.totalHoras}h Totais`, desc: `Total de ${conquistas.totalHoras} horas estudadas`, conquistado: conquistas.totalHoras >= 10 },
    { id: 'sessoes', icon: ZapIcon, titulo: `${conquistas.totalSessoes} Atividades`, desc: `Completou ${conquistas.totalSessoes} atividades`, conquistado: conquistas.totalSessoes >= 10 },
    { id: 'consistencia', icon: StarIcon, titulo: 'Consistente', desc: 'Estudou nos últimos 7 dias', conquistado: unifiedStreak.streak >= 7 }
  ];
  return (
    <Card className="border-border shadow-lg"><CardHeader><CardTitle>Conquistas</CardTitle></CardHeader>
      <CardContent><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {badges.map(b => <div key={b.id} className={`p-4 rounded-xl border ${b.conquistado ? 'border-border bg-card/80 shadow-md' : 'bg-muted/50 opacity-60'}`}><div className="flex items-center gap-3"><b.icon className="w-6 h-6 text-primary" /><div><h3 className="font-bold text-foreground">{b.titulo}</h3><p className="text-xs text-muted-foreground">{b.desc}</p></div></div></div>)}
      </div></CardContent>
    </Card>
  )
}

function HeatMapCalendario({ historico }: { historico: HistoricoItem[] }) {
  const heatmapData = useMemo(() => {
    const dias = Array.from({ length: 90 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (89 - i)); return d; });
    return dias.map(data => {
      const dataStr = data.toISOString().split('T')[0];
      const minutos = historico.filter(item => item.data.split('T')[0] === dataStr).reduce((acc, item) => acc + (item.duracao_minutos || 0), 0);
      return { data: dataStr, minutos, nivel: minutos === 0 ? 0 : minutos < 60 ? 1 : minutos < 120 ? 2 : minutos < 240 ? 3 : 4 };
    });
  }, [historico]);
  const semanas = []; for (let i = 0; i < heatmapData.length; i += 7) semanas.push(heatmapData.slice(i, i + 7));
  const getNivelCor = (nivel: number) => ['bg-muted/50', 'bg-primary/20', 'bg-primary/40', 'bg-primary/70', 'bg-primary'][nivel];
  return (
    <Card className="border-border shadow-lg"><CardHeader><CardTitle>Calendário de Atividade (90d)</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center justify-end gap-1 mb-2 text-xs text-muted-foreground">Menos{[0,1,2,3,4].map(n => <div key={n} className={`w-3 h-3 rounded-sm ${getNivelCor(n)}`} />)}Mais</div>
        <div className="overflow-x-auto"><div className="flex gap-1 min-w-max">
          {semanas.map((semana, sIdx) => <div key={sIdx} className="flex flex-col gap-1">{semana.map((dia, dIdx) => <div key={dIdx} className={`w-3 h-3 rounded-sm ${getNivelCor(dia.nivel)}`} title={`${dia.data}: ${dia.minutos}min`} />)}</div>)}
        </div></div>
      </CardContent>
    </Card>
  )
}

function GraficoProgresso({ historico }: { historico: HistoricoItem[] }) {
  const dados = useMemo(() => {
    const dias = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d; });
    return dias.map(d => ({ data: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), minutos: historico.filter(item => new Date(`${item.data}T00:00:00`).toDateString() === d.toDateString()).reduce((acc, i) => acc + i.duracao_minutos, 0) }));
  }, [historico]);
  return (
    <Card className="border-border shadow-lg"><CardHeader><CardTitle>Progresso (14d)</CardTitle></CardHeader>
      <CardContent><ResponsiveContainer width="100%" height={250}>
        <LineChart data={dados}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="data" className="text-xs" tick={{ fill: 'var(--color-muted-foreground)' }} /><YAxis className="text-xs" tick={{ fill: 'var(--color-muted-foreground)' }} /><Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }} /><Line type="monotone" dataKey="minutos" stroke="var(--color-primary)" strokeWidth={2} /></LineChart>
      </ResponsiveContainer></CardContent>
    </Card>
  )
}

function AnaliseSemanal({ historico }: { historico: HistoricoItem[] }) {
  const dados = useMemo(() => {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const tempo = Array(7).fill(0);
    historico.forEach(i => { tempo[new Date(`${i.data}T00:00:00`).getDay()] += i.duracao_minutos || 0; });
    return dias.map((dia, idx) => ({ dia, minutos: tempo[idx] }));
  }, [historico]);
  return (
    <Card className="border-border shadow-lg"><CardHeader><CardTitle>Análise Semanal</CardTitle></CardHeader>
      <CardContent><ResponsiveContainer width="100%" height={250}>
        <BarChart data={dados}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="dia" className="text-xs" tick={{ fill: 'var(--color-muted-foreground)' }} /><YAxis className="text-xs" tick={{ fill: 'var(--color-muted-foreground)' }} /><Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }} /><Bar dataKey="minutos" fill="var(--color-primary)" radius={[4, 4, 0, 0]} /></BarChart>
      </ResponsiveContainer></CardContent>
    </Card>
  )
}

function EditModal({ registro, onSave, onCancel, isSaving }: { registro: HistoricoItem, onSave: (d: any) => void, onCancel: () => void, isSaving: boolean }) {
  const [formData, setFormData] = useState(() => {
    if (registro.type === 'estudo') {
        return {
            disciplina: registro.disciplina || '',
            topico: registro.topico || '',
            duracao_minutos: registro.duracao_minutos || 0,
            comentarios: registro.comentarios || '',
        };
    } else { // simulado
        return {
            nome: registro.nome || '',
            duracao_minutos: registro.duracao_minutos || 0,
            comentarios: registro.comentarios || '',
            acertos: registro.acertos || 0,
            erros: registro.erros || 0,
            brancos: registro.brancos || 0,
        };
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
  };

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4"><div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />
      <Card className="relative bg-card shadow-2xl max-w-2xl w-full border-primary/50"><CardHeader><CardTitle>Editar Registro</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
            {registro.type === 'estudo' ? (
              <>
                <div><label className="block text-sm font-semibold text-muted-foreground mb-1">Disciplina *</label><Input type="text" name="disciplina" value={(formData as any).disciplina} onChange={handleInputChange} required disabled /></div>
                <div><label className="block text-sm font-semibold text-muted-foreground mb-1">Tópico</label><Input type="text" name="topico" value={(formData as any).topico} onChange={handleInputChange} disabled /></div>
                <div><label className="block text-sm font-semibold text-muted-foreground mb-1">Duração (minutos) *</label><Input type="number" name="duracao_minutos" min="1" value={formData.duracao_minutos} onChange={handleInputChange} required /></div>
                <div><label className="block text-sm font-semibold text-muted-foreground mb-1">Comentários</label><textarea name="comentarios" value={formData.comentarios} onChange={handleInputChange} rows={3} className="w-full rounded-md border border-border bg-background p-2 text-sm" /></div>
              </>
            ) : (
              <>
                <div><label className="block text-sm font-semibold text-muted-foreground mb-1">Nome do Simulado *</label><Input type="text" name="nome" value={(formData as any).nome} onChange={handleInputChange} required /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-semibold text-muted-foreground mb-1">Acertos *</label><Input type="number" name="acertos" min="0" value={(formData as any).acertos} onChange={handleInputChange} required /></div>
                  <div><label className="block text-sm font-semibold text-muted-foreground mb-1">Erros *</label><Input type="number" name="erros" min="0" value={(formData as any).erros} onChange={handleInputChange} required /></div>
                  <div><label className="block text-sm font-semibold text-muted-foreground mb-1">Brancos</label><Input type="number" name="brancos" min="0" value={(formData as any).brancos} onChange={handleInputChange} /></div>
                </div>
                <div><label className="block text-sm font-semibold text-muted-foreground mb-1">Duração (minutos) *</label><Input type="number" name="duracao_minutos" min="1" value={formData.duracao_minutos} onChange={handleInputChange} required /></div>
                <div><label className="block text-sm font-semibold text-muted-foreground mb-1">Comentários</label><textarea name="comentarios" value={formData.comentarios} onChange={handleInputChange} rows={2} className="w-full rounded-md border border-border bg-background p-2 text-sm" /></div>
              </>
            )}
            <div className="flex gap-3 pt-4 border-t border-border"><button type="button" onClick={onCancel} disabled={isSaving} className="flex-1 px-4 py-2 border border-border rounded-lg font-semibold text-muted-foreground hover:bg-muted">Cancelar</button><button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2">{isSaving ? 'Salvando...' : 'Salvar'}</button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingList() {
  return <div className="grid gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4"><SearchIcon className="w-8 h-8 text-muted-foreground/50" /></div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum registro encontrado</h3>
      <p className="text-sm text-muted-foreground max-w-md">Ajuste os filtros ou comece a registrar seus estudos e simulados para ver seu histórico aqui.</p>
    </div>
  )
}