import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { XIcon } from '../icons';
import { TopicPreviewState } from './types';

interface TopicPreviewOverlayProps {
  data: TopicPreviewState;
  onClose: () => void;
  onKeepOpen: () => void;
  onScheduleClose: () => void;
}

const formatDateSafely = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  try {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return value;
  }
};

const TopicPreviewOverlay: React.FC<TopicPreviewOverlayProps> = ({ 
  data, 
  onClose, 
  onKeepOpen, 
  onScheduleClose 
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onKeepOpen();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onKeepOpen]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const rawDescricao = (data.topic as any)?.descricao ?? (data.topic as any)?.detalhes ?? (data.topic as any)?.conteudo ?? (data.topic as any)?.resumo;
  const descricaoCompleta = typeof rawDescricao === 'string' && rawDescricao.trim().length > 0 ? rawDescricao : data.topic.titulo;
  const ultimaRevisaoFormatada = formatDateSafely((data.topic as any)?.ultimaRevisao ?? data.topic.ultimaRevisao);
  const proximaRevisaoFormatada = formatDateSafely((data.topic as any)?.proximaRevisao ?? data.topic.proximaRevisao);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6 sm:px-6"
      onMouseEnter={onKeepOpen}
      onMouseLeave={onScheduleClose}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Pré-visualização do tópico ${data.topic.titulo}`}
        tabIndex={-1}
        className="relative flex h-screen w-screen flex-col overflow-hidden bg-card text-card-foreground focus-visible:outline-none sm:h-[90vh] sm:w-full sm:max-w-3xl sm:rounded-3xl sm:border sm:border-border"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Fechar pré-visualização"
          type="button"
        >
          <XIcon className="h-4 w-4" />
          Fechar
        </button>
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary">{data.diaNome}</span>
              <span className="rounded-full bg-muted/60 px-2.5 py-1 font-medium text-muted-foreground">{data.topic.disciplinaNome}</span>
              <span className="rounded-full bg-muted/60 px-2.5 py-1 font-medium capitalize text-muted-foreground">
                Dificuldade: {data.topic.nivelDificuldade || 'N/A'}
              </span>
              {data.topic.concluidoNaTrilha && (
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-500">Concluído na trilha</span>
              )}
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold leading-tight text-card-foreground sm:text-3xl">{data.topic.titulo}</h2>
              <div className="grid gap-2 text-xs sm:grid-cols-2 sm:text-sm text-muted-foreground">
                {ultimaRevisaoFormatada && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-card-foreground">Última revisão:</span>
                    <span>{ultimaRevisaoFormatada}</span>
                  </div>
                )}
                {proximaRevisaoFormatada && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-card-foreground">Próxima revisão:</span>
                    <span>{proximaRevisaoFormatada}</span>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/60 p-4 text-sm leading-relaxed text-muted-foreground sm:text-base whitespace-pre-wrap">
                {descricaoCompleta}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TopicPreviewOverlay;

