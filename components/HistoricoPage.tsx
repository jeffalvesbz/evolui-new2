import React, { useState, useEffect, useMemo } from "react"
import { useHistoricoStore, HistoricoItem } from "../stores/useHistoricoStore"
import { useEditalStore } from "../stores/useEditalStore"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Skeleton } from "./ui/Skeleton"
import Input from "./ui/Input"
import { ClockIcon, BookOpenIcon, TrendingUpIcon, TargetIcon, BarChart3Icon, TrophyIcon, FlameIcon, ZapIcon, StarIcon, BellIcon, XIcon, Trash2Icon, AlertTriangleIcon, ArrowRightIcon, EditIcon, SaveIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useUnifiedStreak } from "../utils/unifiedStreakCalculator"
import { useDailyGoalStore } from "../stores/useDailyGoalStore"
import CollapsedFilterSection from "./CollapsedFilterSection"
import HistoricoSessoes from "./HistoricoSessoes"

interface HistoricoPageProps {
  setActiveView: (view: string) => void
}

const LoadingList: React.FC = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState: React.FC = () => (
  <div className="text-center py-16">
    <BookOpenIcon className="mx-auto h-12 w-12 text-muted-foreground" />
    <h3 className="mt-4 text-lg font-semibold text-foreground">
      Nenhum registro encontrado
    </h3>
    <p className="mt-1 text-sm text-muted-foreground">
      Tente ajustar os filtros ou adicione uma nova sessão de estudo.
    </p>
  </div>
);

const AnaliseSemanal: React.FC<{ historico: HistoricoItem[] }> = ({ historico }) => {
  const dados = useMemo(() => {
    const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hoje = new Date();
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - (6 - i));
      return d;
    });

    return dias.map(d => {
      const minutos = historico
        .filter(item => {
          const [ano, mes, dia] = item.data.split('-').map(Number)
          const dataItem = new Date(ano, mes - 1, dia)
          return dataItem.toDateString() === d.toDateString()
        })
        .reduce((acc, item) => acc + (item.duracao_minutos || 0), 0);

      return {
        name: diasDaSemana[d.getDay()],
        minutos
      };
    });
  }, [historico]);

  return (
    <Card className="border-border shadow-lg">
      <CardHeader><CardTitle>Análise Semanal</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" className="text-xs" tick={{ fill: 'var(--color-muted-foreground)' }} />
            <YAxis className="text-xs" tick={{ fill: 'var(--color-muted-foreground)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} />
            <Bar dataKey="minutos" fill="var(--color-secondary)" name="Minutos" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface EditModalProps {
  registro: HistoricoItem;
  onSave: (updatedData: any) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ registro, onSave, onCancel, isSaving }) => {
  const limparComentariosParaExibicao = (comentarios: string | undefined) => {
    if (!comentarios) return '';
    return comentarios
      .replace(/\[Tópico: .*?\]/g, '')
      .replace(/\[Disciplina: .*?\]/g, '')
      .replace(/\[Origem: .*?\]/g, '')
      .trim();
  };

  const comentariosLimpos = limparComentariosParaExibicao(registro.comentarios);
  const [formData, setFormData] = useState({
    ...registro,
    comentarios: comentariosLimpos
  });
  const comentariosOriginais = registro.comentarios;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const mesclarComentariosComMarcadores = (novoComentario: string, original: string | undefined) => {
    if (!original) return novoComentario;
    const marcadores = original.match(/\[.*?: .*?\]/g) || [];
    return `${novoComentario}\n\n${marcadores.join('\n')}`.trim();
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <Card className="w-full max-w-lg relative z-10 border-border bg-card shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <EditIcon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">Editar Registro</CardTitle>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-muted transition-colors">
            <XIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Data</label>
                <Input
                  type="date"
                  name="data"
                  value={formData.data.split('T')[0]}
                  onChange={handleChange}
                  className="w-full bg-background border-input focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Duração (min)</label>
                <Input
                  type="number"
                  name="duracao_minutos"
                  value={formData.duracao_minutos}
                  onChange={handleChange}
                  className="w-full bg-background border-input focus:ring-primary"
                />
              </div>
            </div>

            {registro.type === 'estudo' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Disciplina</label>
                  <Input
                    name="disciplina"
                    value={formData.disciplina || ''}
                    onChange={handleChange}
                    className="w-full bg-background border-input focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tópico</label>
                  <Input
                    name="topico"
                    value={formData.topico || ''}
                    onChange={handleChange}
                    className="w-full bg-background border-input focus:ring-primary"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nome do Simulado</label>
                <Input
                  name="nome"
                  value={formData.nome || ''}
                  onChange={handleChange}
                  className="w-full bg-background border-input focus:ring-primary"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Comentários</label>
              <textarea
                name="comentarios"
                value={formData.comentarios || ''}
                onChange={handleChange}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Adicione observações sobre este estudo..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </form>
        </CardContent>
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
  const [editModal, setEditModal] = useState<{ isOpen: boolean; registro: HistoricoItem | null }>({
    isOpen: false,
    registro: null
  })
  const [isSaving, setIsSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; type: 'estudo' | 'simulado' | null; name: string | null }>({
    isOpen: false,
    id: null,
    type: null,
    name: null
  })

  useEffect(() => {
    if (editalAtivo?.id) {
      fetchHistorico(editalAtivo.id)
    }
  }, [editalAtivo?.id, fetchHistorico])

  useEffect(() => {
    const checkMeta = () => {
      const hoje = new Date()
      const hojeStr = hoje.toISOString().split('T')[0]

      const tempoHoje = historico
        .filter(item => {
          const [ano, mes, dia] = item.data.split('-').map(Number)
          const dataItem = new Date(ano, mes - 1, dia)
          const dataNormalizada = new Date(dataItem.getFullYear(), dataItem.getMonth(), dataItem.getDate())
          const hojeNormalizada = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
          return dataNormalizada.getTime() === hojeNormalizada.getTime()
        })
        .reduce((acc, item) => acc + (item.duracao_minutos || 0), 0)

      if (metaDiaria > 0 && tempoHoje >= metaDiaria) {
        const lastNotified = localStorage.getItem(`meta_notified_${hojeStr}`)
        if (!lastNotified) {
          setShowNotification(true)
          localStorage.setItem(`meta_notified_${hojeStr}`, 'true')
        }
      }
    }

    checkMeta()
  }, [historico, metaDiaria])

  const historicoFiltrado = useMemo(() => {
    return historico.filter((item) => {
      const matchSearch =
        (item.disciplina?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.topico?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.nome?.toLowerCase() || "").includes(searchTerm.toLowerCase())

      const matchOrigem = filterOrigem === "all" || item.origem === filterOrigem

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
              const inicio = new Date(anoInicio, mesInicio - 1, diaInicio)
              const [anoFim, mesFim, diaFim] = dataFim.split('-').map(Number)
              const fim = new Date(anoFim, mesFim - 1, diaFim)
              matchData = itemData >= inicio && itemData <= fim
            }
            break
        }
      }

      return matchSearch && matchOrigem && matchData
    })
  }, [historico, searchTerm, filterOrigem, filterData, dataInicio, dataFim])

  const handleEditClick = (registro: HistoricoItem) => {
    setEditModal({ isOpen: true, registro })
  }

  const handleSaveEdit = async (updatedData: any) => {
    setIsSaving(true)
    try {
      const { updateHistoricoItem } = useHistoricoStore.getState()
      await updateHistoricoItem(updatedData.id, updatedData)
      setEditModal({ isOpen: false, registro: null })
    } catch (error) {
      console.error("Erro ao salvar edição:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditModal({ isOpen: false, registro: null })
  }

  const handleDeleteClick = (id: string, type: 'estudo' | 'simulado', name: string) => {
    setDeleteModal({ isOpen: true, id, type, name })
  }

  const historicoAgrupado = useMemo(() => {
    const grupos = historicoFiltrado.reduce((acc, item) => {
      const dataKey = item.data.split('T')[0];
      if (!acc[dataKey]) {
        acc[dataKey] = [];
      }
      acc[dataKey].push(item);
      return acc;
    }, {} as Record<string, HistoricoItem[]>);

    return Object.entries(grupos)
      .sort(([dataA], [dataB]) => new Date(dataB).getTime() - new Date(dataA).getTime())
      .map(([data, items]) => ({ data, items }));
  }, [historicoFiltrado]);

  return (
    <div data-tutorial="historico-content" className="min-h-screen bg-gray-50/50 dark:bg-background transition-colors duration-300">
      {showNotification && (
        <div className="fixed top-4 right-4 z-[101] animate-in slide-in-from-top-5">
          <Card className="border border-primary bg-card shadow-2xl max-w-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BellIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    🎉 Meta Diária Atingida!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Parabéns! Você alcançou sua meta de estudos hoje. Continue assim!
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

      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Coluna Principal (Esquerda) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Header */}
            <Header />

            {/* 2. Filtros */}
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

            {/* 3. Lista de Histórico */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">
                  Histórico de Atividades
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {historicoFiltrado.length} {historicoFiltrado.length === 1 ? 'registro encontrado' : 'registros encontrados'}
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingList />
                ) : historicoFiltrado.length ? (
                  <HistoricoSessoes
                    historico={historicoFiltrado}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ) : (
                  <EmptyState />
                )}
              </CardContent>
            </Card>

            {/* 4. Gráficos (mantidos no final) */}
            <div className="grid gap-6 lg:grid-cols-2">
              <GraficoProgresso historico={historico} />
              <HeatMapCalendario historico={historico} />
            </div>
          </div>

          {/* Sidebar (Direita) */}
          <div className="space-y-6 lg:sticky lg:top-8">
            {/* 1. Meta Diária */}
            <MetaDiaria historico={historico} meta={metaDiaria} setMeta={setMetaDiaria} />

            {/* 2. Métricas rápidas */}
            <Stats historico={historicoFiltrado} />

            {/* 3. Análise Semanal */}
            <AnaliseSemanal historico={historico} />

            {/* 4. Conquistas */}
            <ConquistasCarousel historico={historico} />

            {/* 5. Botão Análise Profunda */}
            <Card className="border-border shadow-sm bg-gradient-to-br from-card to-muted/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Análise Profunda</h3>
                    <p className="text-xs text-muted-foreground">Veja gráficos detalhados</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveView('estatisticas')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                >
                  Ver Estatísticas Completas
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteModal({ isOpen: false, id: null, type: null, name: null })} />
          <Card className="w-full max-w-md relative z-10 border-border bg-card shadow-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-red-500/10">
                  <AlertTriangleIcon className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    Excluir Registro?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tem certeza que deseja excluir o registro de <strong>{deleteModal.name}</strong>? Esta ação não pode ser desfeita.
                  </p>
                </div>
                <button
                  onClick={() => setDeleteModal({ isOpen: false, id: null, type: null, name: null })}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <XIcon className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, id: null, type: null, name: null })}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (deleteModal.id) {
                      const { deleteHistoricoItem } = useHistoricoStore.getState()
                      await deleteHistoricoItem(deleteModal.id)
                      setDeleteModal({ isOpen: false, id: null, type: null, name: null })
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  <Trash2Icon className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editModal.isOpen && editModal.registro && (
        <EditModal
          registro={editModal.registro}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
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
    { id: 'streak', icon: FlameIcon, titulo: `${conquistas.streakAtual} Dias de Fogo`, desc: `Dias seguidos: ${conquistas.streakAtual} dias`, conquistado: conquistas.streakAtual >= 3, color: 'text-orange-500' },
    { id: 'horas', icon: TrophyIcon, titulo: `${conquistas.totalHoras}h Totais`, desc: `Total de ${conquistas.totalHoras} horas estudadas`, conquistado: conquistas.totalHoras >= 10, color: 'text-yellow-500' },
    { id: 'sessoes', icon: ZapIcon, titulo: `${conquistas.totalSessoes} Atividades`, desc: `Completou ${conquistas.totalSessoes} atividades`, conquistado: conquistas.totalSessoes >= 10, color: 'text-purple-500' },
    { id: 'consistencia', icon: StarIcon, titulo: 'Consistente', desc: 'Estudou nos últimos 7 dias', conquistado: unifiedStreak.streak >= 7, color: 'text-blue-500' }
  ];

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % badges.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + badges.length) % badges.length);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-foreground">Conquistas</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={prevSlide}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeftIcon className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={nextSlide}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Próximo"
            >
              <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {badges.map((b, idx) => {
            const Icon = b.icon;
            // Only show 2 items at a time in the sidebar carousel to save space, or use the index to filter
            // Actually, let's show all 4 but in a 2x2 grid if possible, or just 1x4 if vertical.
            // Given the carousel logic (currentIndex), we might want to show just a subset.
            // But the current logic highlights the current index but renders ALL.
            // Let's keep rendering all but in a grid that fits.
            return (
              <div
                key={b.id}
                className={`p-3 rounded-xl border transition-all duration-300 ${b.conquistado
                  ? 'border-border bg-card/80 shadow-sm'
                  : 'bg-muted/30 opacity-60 border-transparent'
                  } ${idx === currentIndex ? 'ring-2 ring-primary' : ''
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${b.color}`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs text-foreground truncate">{b.titulo}</h3>
                    <p className="text-[10px] text-muted-foreground truncate">{b.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function Stats({ historico }: { historico: HistoricoItem[] }) {
  const totalMin = historico.reduce((acc, h) => acc + (h.duracao_minutos || 0), 0)
  const totalSessions = historico.length
  const avg = totalSessions ? (totalMin / totalSessions).toFixed(1) : "0"
  const formatarTempo = (minutos: number) => { const h = Math.floor(minutos / 60); const m = minutos % 60; return `${h}h ${m}min` }

  return (
    <div className="grid gap-4 grid-cols-3">
      <Card className="border-border shadow-md hover:shadow-lg transition-all duration-300 col-span-1">
        <CardHeader className="p-4 pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold text-muted-foreground leading-tight">Tempo Total</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-lg font-bold text-foreground break-words leading-tight mt-1">{formatarTempo(totalMin)}</div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-md hover:shadow-lg transition-all duration-300 col-span-1">
        <CardHeader className="p-4 pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold text-muted-foreground leading-tight">Atividades</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-foreground mt-1">{totalSessions}</div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-md hover:shadow-lg transition-all duration-300 col-span-1">
        <CardHeader className="p-4 pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold text-muted-foreground leading-tight">Média</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-lg font-bold text-foreground break-words leading-tight mt-1">{avg} min</div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetaDiaria({ historico, meta, setMeta }: { historico: HistoricoItem[], meta: number, setMeta: (m: number) => void }) {
  const tempoHoje = useMemo(() => {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    return historico.filter(item => {
      const [ano, mes, dia] = item.data.split('-').map(Number);
      const dataItem = new Date(ano, mes - 1, dia);
      dataItem.setHours(0, 0, 0, 0);
      return dataItem.toISOString().split('T')[0] === hojeStr;
    }).reduce((acc, item) => acc + (item.duracao_minutos || 0), 0);
  }, [historico]);
  const percentual = meta > 0 ? Math.round((tempoHoje / meta) * 100) : 0;
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
              {[60, 90, 120, 150, 180, 210, 240, 300, 360, 420, 480, 540, 600, 660, 720].map(m => <option key={m} value={m}>{formatarTempo(m)}</option>)}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex justify-between mb-2"><span className="text-2xl font-bold text-foreground">{formatarTempo(tempoHoje)}</span><span className="text-sm font-semibold text-muted-foreground">de {formatarTempo(meta)}</span></div>
        <div className="relative h-4 bg-muted rounded-full"><div className={`h-full transition-all duration-500 rounded-full ${percentual >= 100 ? 'bg-secondary' : 'bg-primary'}`} style={{ width: `${Math.min(percentual, 100)}%` }} /></div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground"><span>{percentual}% concluído</span><span>{faltam > 0 ? `Faltam ${formatarTempo(faltam)}` : percentual > 100 ? `🎉 ${Math.round(percentual - 100)}% além da meta!` : '🎉 Meta atingida!'}</span></div>
      </CardContent>
    </Card>
  )
}

function HeatMapCalendario({ historico }: { historico: HistoricoItem[] }) {
  const heatmapData = useMemo(() => {
    const dias = Array.from({ length: 90 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (89 - i)); return d; });
    return dias.map(data => {
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      const dataStr = `${ano}-${mes}-${dia}`;
      const minutos = historico.filter(item => item.data.split('T')[0] === dataStr).reduce((acc, item) => acc + (item.duracao_minutos || 0), 0);
      return { data: dataStr, minutos, nivel: minutos === 0 ? 0 : minutos < 60 ? 1 : minutos < 120 ? 2 : minutos < 240 ? 3 : 4 };
    });
  }, [historico]);
  const semanas = []; for (let i = 0; i < heatmapData.length; i += 7) semanas.push(heatmapData.slice(i, i + 7));
  const getNivelCor = (nivel: number) => ['bg-muted/50', 'bg-primary/20', 'bg-primary/40', 'bg-primary/70', 'bg-primary'][nivel];
  return (
    <Card className="border-border shadow-lg"><CardHeader><CardTitle>Calendário de Atividade (90d)</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center justify-end gap-1 mb-2 text-xs text-muted-foreground">Menos{[0, 1, 2, 3, 4].map(n => <div key={n} className={`w-3 h-3 rounded-sm ${getNivelCor(n)}`} />)}Mais</div>
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
    return dias.map(d => ({
      data: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      minutos: historico.filter(item => {
        const [ano, mes, dia] = item.data.split('-').map(Number);
        const dataItem = new Date(ano, mes - 1, dia);
        return dataItem.toDateString() === d.toDateString();
      }).reduce((acc, i) => acc + (i.duracao_minutos || 0), 0)
    }));
  }, [historico]);
  return (
    <Card className="border-border shadow-lg"><CardHeader><CardTitle>Progresso (14d)</CardTitle></CardHeader>
      <CardContent><ResponsiveContainer width="100%" height={250}>
        <LineChart data={dados}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="data" className="text-xs" tick={{ fill: 'var(--color-muted-foreground)' }} /><YAxis className="text-xs" tick={{ fill: 'var(--color-muted-foreground)' }} /><Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} /><Line type="monotone" dataKey="minutos" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} /></LineChart>
      </ResponsiveContainer></CardContent>
    </Card>
  )
}
