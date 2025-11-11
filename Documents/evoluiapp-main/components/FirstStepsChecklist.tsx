import React from 'react';
import { useFirstStepsStore } from '../stores/useFirstStepsStore';
import { useModalStore } from '../stores/useModalStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { CheckCircle2Icon, CircleDashedIcon, SparklesIcon, ArrowRightIcon } from './icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Progress, Button } from '../lib/dashboardMocks';
import { motion } from 'framer-motion';

interface FirstStepsChecklistProps {
  setActiveView?: (view: string) => void;
}

const FirstStepsChecklist: React.FC<FirstStepsChecklistProps> = ({ setActiveView }) => {
  const { getProgress, isComplete } = useFirstStepsStore();
  const { openEditalModal } = useModalStore();
  const { iniciarSessaoInteligente } = useEstudosStore();

  const progress = getProgress();

  // Se todas as etapas estão completas, não mostrar o checklist
  if (isComplete()) {
    return null;
  }

  const handleStepAction = (stepId: string) => {
    switch (stepId) {
      case 'create-edital':
        openEditalModal();
        break;
      case 'add-disciplines':
        setActiveView?.('edital');
        break;
      case 'set-goal':
        // A meta pode ser definida no próprio dashboard, então apenas scroll para a seção
        const goalSection = document.querySelector('[data-goal-section]');
        goalSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'first-study':
        iniciarSessaoInteligente();
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card border-primary/20 shadow-lg shadow-primary/10">
        <CardHeader className="bg-gradient-to-br from-primary/10 via-background/0 to-background/0">
          <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            <SparklesIcon className="h-4 w-4" />
            Primeiros Passos
          </CardDescription>
          <CardTitle className="text-2xl mt-2 font-bold">Complete seu perfil</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Siga estes passos para começar sua jornada de estudos
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {progress.steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  step.completed
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-background/30 border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {step.completed ? (
                    <CheckCircle2Icon className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <CircleDashedIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      step.completed ? 'text-foreground line-through' : 'text-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {!step.completed && (
                  <button
                    onClick={() => handleStepAction(step.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Fazer
                    <ArrowRightIcon className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold text-foreground">
                {progress.completed} de {progress.total} completos
              </span>
            </div>
            <Progress value={progress.percentage} />
            <p className="text-xs text-center text-muted-foreground">
              {progress.percentage}% concluído
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FirstStepsChecklist;


