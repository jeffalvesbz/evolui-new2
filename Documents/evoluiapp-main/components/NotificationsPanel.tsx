import React, { useMemo } from 'react';
import { BellIcon, XIcon, CalendarClockIcon, TargetIcon, AlertTriangleIcon, CheckCircle2Icon } from './icons';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useDailyGoalStore } from '../stores/useDailyGoalStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useEditalStore } from '../stores/useEditalStore';
import { useModalStore } from '../stores/useModalStore';
import { startOfDay, isSameDay, isBefore } from 'date-fns';

interface Notification {
  id: string;
  type: 'revisao' | 'meta' | 'atrasada' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveView: (view: string) => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose, setActiveView }) => {
  const { revisoes } = useRevisoesStore();
  const { goalMinutes } = useDailyGoalStore();
  const { sessoes } = useEstudosStore();
  const { editalAtivo } = useEditalStore();

  const notifications = useMemo(() => {
    const notifs: Notification[] = [];
    const hoje = startOfDay(new Date());

    // Revisões pendentes para hoje
    const revisoesHoje = revisoes.filter(r => {
      const dataPrevista = startOfDay(new Date(r.data_prevista));
      return r.status === 'pendente' && isSameDay(dataPrevista, hoje);
    });

    if (revisoesHoje.length > 0) {
      notifs.push({
        id: 'revisoes-hoje',
        type: 'revisao',
        title: `${revisoesHoje.length} ${revisoesHoje.length === 1 ? 'revisão pendente' : 'revisões pendentes'}`,
        message: `Você tem ${revisoesHoje.length} ${revisoesHoje.length === 1 ? 'revisão agendada' : 'revisões agendadas'} para hoje.`,
        action: {
          label: 'Ver revisões',
          onClick: () => {
            setActiveView('revisoes');
            onClose();
          }
        },
        timestamp: new Date()
      });
    }

    // Revisões atrasadas
    const revisoesAtrasadas = revisoes.filter(r => {
      const dataPrevista = startOfDay(new Date(r.data_prevista));
      return (r.status === 'pendente' || r.status === 'atrasada') && isBefore(dataPrevista, hoje);
    });

    if (revisoesAtrasadas.length > 0) {
      notifs.push({
        id: 'revisoes-atrasadas',
        type: 'atrasada',
        title: `${revisoesAtrasadas.length} ${revisoesAtrasadas.length === 1 ? 'revisão atrasada' : 'revisões atrasadas'}`,
        message: `Você tem ${revisoesAtrasadas.length} ${revisoesAtrasadas.length === 1 ? 'revisão que está atrasada' : 'revisões que estão atrasadas'}.`,
        action: {
          label: 'Ver revisões',
          onClick: () => {
            setActiveView('revisoes');
            onClose();
          }
        },
        timestamp: new Date()
      });
    }

    // Meta diária
    const hojeISO = new Date().toISOString().split('T')[0];
    const sessoesDeHoje = sessoes.filter(s => s.data_estudo === hojeISO);
    const tempoTotalSegundos = sessoesDeHoje.reduce((acc, s) => acc + s.tempo_estudado, 0);
    const tempoTotalMinutos = Math.round(tempoTotalSegundos / 60);
    const metaPercentual = goalMinutes > 0 ? Math.round((tempoTotalMinutos / goalMinutes) * 100) : 0;

    if (metaPercentual < 50 && tempoTotalMinutos > 0) {
      const faltam = goalMinutes - tempoTotalMinutos;
      notifs.push({
        id: 'meta-diaria',
        type: 'meta',
        title: 'Meta diária em andamento',
        message: `Você estudou ${Math.floor(tempoTotalMinutos / 60)}h ${tempoTotalMinutos % 60}min hoje. Faltam ${Math.floor(faltam / 60)}h ${faltam % 60}min para atingir sua meta.`,
        action: {
          label: 'Registrar estudo',
          onClick: () => {
            const { iniciarSessaoInteligente } = useEstudosStore.getState();
            iniciarSessaoInteligente();
            onClose();
          }
        },
        timestamp: new Date()
      });
    } else if (tempoTotalMinutos === 0) {
      notifs.push({
        id: 'meta-nao-iniciada',
        type: 'meta',
        title: 'Comece seus estudos hoje!',
        message: `Sua meta diária é de ${Math.floor(goalMinutes / 60)}h ${goalMinutes % 60}min. Você ainda não estudou hoje.`,
        action: {
          label: 'Registrar estudo',
          onClick: () => {
            const { iniciarSessaoInteligente } = useEstudosStore.getState();
            iniciarSessaoInteligente();
            onClose();
          }
        },
        timestamp: new Date()
      });
    }

    // Verificar se não há edital ativo
    if (!editalAtivo) {
      notifs.push({
        id: 'sem-edital',
        type: 'info',
        title: 'Nenhum plano de estudo ativo',
        message: 'Selecione ou crie um plano de estudo para começar a organizar seus estudos.',
        action: {
          label: 'Gerenciar editais',
          onClick: () => {
            const { openEditalModal } = useModalStore.getState();
            openEditalModal();
            onClose();
          }
        },
        timestamp: new Date()
      });
    }

    return notifs.sort((a, b) => {
      // Priorizar atrasadas, depois revisões, depois meta, depois info
      const priority = { 'atrasada': 0, 'revisao': 1, 'meta': 2, 'info': 3 };
      return priority[a.type] - priority[b.type];
    });
  }, [revisoes, goalMinutes, sessoes, editalAtivo, setActiveView, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-20 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Notificações</h3>
            {notifications.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                {notifications.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
            aria-label="Fechar notificações"
          >
            <XIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2Icon className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação no momento</p>
              <p className="text-xs text-muted-foreground mt-1">Você está em dia! 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => {
                const getIcon = () => {
                  switch (notif.type) {
                    case 'atrasada':
                      return <AlertTriangleIcon className="h-5 w-5 text-red-500" />;
                    case 'revisao':
                      return <CalendarClockIcon className="h-5 w-5 text-primary" />;
                    case 'meta':
                      return <TargetIcon className="h-5 w-5 text-yellow-500" />;
                    default:
                      return <BellIcon className="h-5 w-5 text-muted-foreground" />;
                  }
                };

                const getBgColor = () => {
                  switch (notif.type) {
                    case 'atrasada':
                      return 'bg-red-500/10';
                    case 'revisao':
                      return 'bg-primary/10';
                    case 'meta':
                      return 'bg-yellow-500/10';
                    default:
                      return 'bg-muted/30';
                  }
                };

                return (
                  <div
                    key={notif.id}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getBgColor()} flex-shrink-0`}>
                        {getIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground mb-1">
                          {notif.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          {notif.message}
                        </p>
                        {notif.action && (
                          <button
                            onClick={notif.action.onClick}
                            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            {notif.action.label} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPanel;

