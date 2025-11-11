import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, PlayIcon, XIcon } from '../icons';
import { useEstudosStore } from '../../stores/useEstudosStore';
import { useUiStore } from '../../stores/useUiStore';
import { DraggableTopic } from './types';
import { SortableItem } from './SortableItem';
import { motion, useAnimation } from 'framer-motion';

interface TopicCardProps {
  topic: DraggableTopic;
  isDragging?: boolean;
  isDragOver?: boolean;
  onRemove?: (topicId: string) => void;
  onToggleConcluido: () => void;
}

const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  isDragging = false,
  isDragOver = false,
  onRemove,
  onToggleConcluido,
}) => {
  const { iniciarSessao, iniciarSessaoParaConclusaoRapida } = useEstudosStore();
  const { isSaveModalOpen } = useUiStore();
  const controls = useAnimation();
  const previouslyDragging = useRef(false);
  const descricaoCompleta = useMemo(() => {
    const descricao =
      (topic as any)?.descricao ||
      (topic as any)?.detalhes ||
      (topic as any)?.conteudo ||
      (topic as any)?.resumo;
    return typeof descricao === 'string' && descricao.trim() ? descricao.trim() : null;
  }, [topic]);
  
  const temDescricao = descricaoCompleta !== null && descricaoCompleta !== topic.titulo;
  const concluidoNaTrilha = !!topic.concluidoNaTrilha;
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (previouslyDragging.current && !isDragging) {
      controls.start({
        scale: [1.05, 0.98, 1],
        transition: { duration: 0.3, ease: 'easeOut' },
      });
    }
    previouslyDragging.current = isDragging;
  }, [isDragging, controls]);

  const handleConcluir = () => {
    onToggleConcluido();
    iniciarSessaoParaConclusaoRapida({
      id: topic.id,
      nome: topic.titulo,
      disciplinaId: topic.disciplinaId,
    }, {
      origemTrilha: true,
    });
  };

  const handleIniciarEstudo = () => {
    iniciarSessao({
      id: topic.id,
      nome: topic.titulo,
      disciplinaId: topic.disciplinaId,
    }, 'cronometro', {
      origemTrilha: true,
    });
  };

  const disciplinaColor = useMemo(() => {
    if (!topic.disciplinaId) return '#94a3b8';
    const hue = (topic.disciplinaId.charCodeAt(0) * 137.5) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }, [topic.disciplinaId]);

  // Posicionar tooltip
  useEffect(() => {
    if (!showTooltip || !tooltipRef.current || !cardRef.current) return;

    const updateTooltipPosition = () => {
      if (!tooltipRef.current || !cardRef.current) return;

      const cardRect = cardRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 16;
      const tooltipWidth = Math.min(400, viewportWidth - padding * 2);

      let top = cardRect.bottom + 8;
      let left = cardRect.left + (cardRect.width / 2) - (tooltipWidth / 2);

      if (left < padding) left = padding;
      if (left + tooltipWidth > viewportWidth - padding) {
        left = viewportWidth - tooltipWidth - padding;
      }

      if (top + tooltip.offsetHeight > viewportHeight - padding) {
        top = cardRect.top - tooltip.offsetHeight - 8;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
      tooltip.style.width = `${tooltipWidth}px`;
    };

    requestAnimationFrame(updateTooltipPosition);
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', () => setShowTooltip(false), true);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', () => setShowTooltip(false), true);
    };
  }, [showTooltip]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Fechar tooltip quando modal abrir
  useEffect(() => {
    if (isSaveModalOpen) {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      setShowTooltip(false);
    }
  }, [isSaveModalOpen]);

  return (
    <>
      <SortableItem id={topic.id} disabled={concluidoNaTrilha}>
        <motion.div
          animate={controls}
          whileHover={{ scale: concluidoNaTrilha ? 1 : 1.01 }}
          className="h-full w-full"
        >
          <div
            ref={cardRef}
            className={`group relative flex h-full w-full flex-col rounded-xl border p-3 transition-all duration-200 ${
              concluidoNaTrilha
                ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5'
                : 'border-border/50 bg-card/60 hover:border-primary/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/10'
            } ${isDragging ? 'opacity-40 scale-95' : ''} ${
              isDragOver ? 'border-primary/60 bg-primary/10 ring-2 ring-primary/40' : ''
            }`}
            onMouseEnter={() => {
              if (!isDragging && !isSaveModalOpen) {
                if (tooltipTimeoutRef.current) {
                  clearTimeout(tooltipTimeoutRef.current);
                }
                tooltipTimeoutRef.current = setTimeout(() => {
                  setShowTooltip(true);
                }, 200);
              }
            }}
            onMouseLeave={() => {
              if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
              }
              setShowTooltip(false);
            }}
          >
            {/* Header com disciplina e badge */}
            <div className="flex items-start justify-between gap-2 mb-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm"
                  style={{ 
                    backgroundColor: disciplinaColor,
                    boxShadow: `0 0 6px ${disciplinaColor}50`
                  }}
                />
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 truncate">
                  {topic.disciplinaNome}
                </p>
              </div>
              {concluidoNaTrilha && (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-emerald-500" />
                </div>
              )}
            </div>

            {/* Título */}
            <h4
              className={`text-sm font-bold leading-tight line-clamp-2 mb-2 flex-shrink-0 ${
                concluidoNaTrilha 
                  ? 'text-muted-foreground/70 line-through' 
                  : 'text-foreground'
              }`}
            >
              {topic.titulo}
            </h4>

            {/* Descrição */}
            {temDescricao && descricaoCompleta && (
              <p
                className="text-[11px] text-foreground/70 leading-relaxed flex-1 overflow-hidden min-h-0"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {descricaoCompleta}
              </p>
            )}

            {/* Ações */}
            <div className="flex items-center justify-end gap-1 mt-1.5 pt-1.5 border-t border-border/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleIniciarEstudo();
                }}
                className="p-1 rounded text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="Iniciar estudo"
              >
                <PlayIcon className="h-3 w-3" />
              </button>
              {concluidoNaTrilha ? (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onToggleConcluido();
                  }}
                  className="p-1 rounded text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  aria-label="Desmarcar como concluído"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              ) : (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleConcluir();
                  }}
                  className="p-1 rounded text-muted-foreground/60 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                  aria-label="Marcar como concluído"
                >
                  <CheckIcon className="h-3 w-3" />
                </button>
              )}
              {onRemove && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRemove(topic.id);
                  }}
                  className="p-1 rounded text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label="Remover tópico"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </SortableItem>
      
      {/* Tooltip renderizado fora do SortableItem para evitar conflitos */}
      {showTooltip && !isDragging && !isSaveModalOpen && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] p-3 bg-card/98 backdrop-blur-lg border-2 border-primary/30 rounded-xl shadow-2xl max-w-sm max-h-[60vh] overflow-y-auto pointer-events-none ring-2 ring-primary/20"
          style={{
            opacity: 1,
          }}
        >
          {/* Header do tooltip */}
          <div className="mb-2 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-lg"
                style={{ 
                  backgroundColor: disciplinaColor,
                  boxShadow: `0 0 8px ${disciplinaColor}80`
                }}
              />
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/90">
                {topic.disciplinaNome}
              </p>
              {concluidoNaTrilha && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-400 text-[9px] font-bold border border-emerald-500/40">
                  CONCLUÍDO
                </span>
              )}
            </div>
            <h4 className={`text-sm font-bold text-foreground leading-tight ${
              concluidoNaTrilha ? 'line-through text-muted-foreground/60' : ''
            }`}>
              {topic.titulo}
            </h4>
          </div>
          
          {/* Conteúdo detalhado */}
          {temDescricao && descricaoCompleta && (
            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">
                  Descrição
                </p>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                  {descricaoCompleta}
                </p>
              </div>
              
              {/* Informações adicionais se disponíveis */}
              {(topic as any).tempoEstimado && (
                <div className="pt-2 border-t border-border/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-0.5">
                    Tempo Estimado
                  </p>
                  <p className="text-xs text-foreground/90">
                    {(topic as any).tempoEstimado}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default TopicCard;
