import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, ChevronRightIcon, ChevronLeftIcon } from './icons';

interface TutorialStep {
  id: string;
  target: string; // selector CSS para o elemento a destacar
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  view?: string; // view para navegar antes de mostrar este passo
}

interface OnboardingTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  setActiveView?: (view: string) => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    target: '[data-tutorial="sidebar"]',
    title: 'Bem-vindo ao Evolui! 👋',
    description: 'Vamos começar configurando seu plano de estudos. Siga os passos abaixo para começar a usar o aplicativo.',
    position: 'right',
    view: 'dashboard'
  },
  {
    id: 'passo1-edital-button',
    target: '[data-tutorial="edital-manage-button"]',
    title: 'Passo 1: Adicione um Edital',
    description: 'Clique neste botão para abrir o gerenciamento de editais. No modal que abrir, clique em "Novo Edital" para criar seu primeiro plano de estudos. Preencha o nome, data alvo e outras informações do seu concurso.',
    position: 'bottom',
    view: 'dashboard'
  },
  {
    id: 'passo2-disciplinas',
    target: '[data-tutorial="adicionar-disciplina-button"]',
    title: 'Passo 2: Cadastre Disciplinas',
    description: 'Agora cadastre as disciplinas do seu edital. Clique em "Adicionar Disciplina" e preencha o nome da disciplina. Você também pode adicionar os tópicos de cada matéria agora ou depois.',
    position: 'bottom',
    view: 'edital'
  },
  {
    id: 'dashboard',
    target: '[data-tutorial="dashboard-content"]',
    title: 'Dashboard - Visão Geral',
    description: 'O Dashboard é sua central de controle. Aqui você vê métricas do dia, tempo de estudo, revisões pendentes, progresso semanal e ações recomendadas para manter seu ritmo de estudos.',
    position: 'bottom',
    view: 'dashboard'
  },
  {
    id: 'planejamento',
    target: '[data-tutorial="planejamento-content"]',
    title: 'Planejamento Semanal',
    description: 'Aqui você organiza seus estudos por semana. Arraste e solte tópicos para planejar quando estudar cada assunto. Use o calendário para visualizar sua semana e manter o foco.',
    position: 'bottom',
    view: 'planejamento'
  },
  {
    id: 'ciclos',
    target: '[data-tutorial="ciclos-content"]',
    title: 'Ciclos de Estudos',
    description: 'Crie ciclos de estudos para organizar tópicos em sequência. Os ciclos ajudam você a revisar matérias de forma sistemática e manter um ritmo constante de aprendizado.',
    position: 'bottom',
    view: 'ciclos'
  },
  {
    id: 'edital',
    target: '[data-tutorial="edital-content"]',
    title: 'Gerenciar Edital',
    description: 'Configure seu edital adicionando disciplinas e tópicos. Aqui você organiza todo o conteúdo que precisa estudar para o seu concurso. Use o painel de gerenciamento para adicionar tópicos em lote.',
    position: 'bottom',
    view: 'edital'
  },
  {
    id: 'flashcards',
    target: '[data-tutorial="flashcards-content"]',
    title: 'Flashcards',
    description: 'Crie e estude flashcards para memorização. Os flashcards usam o sistema de repetição espaçada (SRS) para otimizar sua revisão. Quanto mais você acerta, menos frequente será a revisão.',
    position: 'bottom',
    view: 'flashcards'
  },
  {
    id: 'revisoes',
    target: '[data-tutorial="revisoes-content"]',
    title: 'Revisões Programadas',
    description: 'Visualize e faça suas revisões programadas. O sistema calcula automaticamente quando revisar cada tópico baseado no algoritmo de repetição espaçada. Mantenha sua revisão em dia!',
    position: 'bottom',
    view: 'revisoes'
  },
  {
    id: 'erros',
    target: '[data-tutorial="erros-content"]',
    title: 'Caderno de Erros',
    description: 'Registre e analise os erros que cometeu em questões. O caderno de erros ajuda você a identificar padrões de erro e focar nos pontos que precisam de mais atenção.',
    position: 'bottom',
    view: 'erros'
  },
  {
    id: 'simulados',
    target: '[data-tutorial="simulados-content"]',
    title: 'Simulados',
    description: 'Registre seus simulados e acompanhe seu desempenho. Compare suas notas ao longo do tempo e veja sua evolução. Use os simulados para identificar áreas que precisam de mais estudo.',
    position: 'bottom',
    view: 'simulados'
  },
  {
    id: 'historico',
    target: '[data-tutorial="historico-content"]',
    title: 'Histórico de Estudos',
    description: 'Veja todo o seu histórico de sessões de estudo. Acompanhe seu progresso ao longo do tempo, visualize gráficos de produtividade e mantenha um registro detalhado de sua jornada.',
    position: 'bottom',
    view: 'historico'
  },
  {
    id: 'estatisticas',
    target: '[data-tutorial="estatisticas-content"]',
    title: 'Estatísticas Detalhadas',
    description: 'Acesse estatísticas avançadas sobre seus estudos. Veja gráficos de tempo por disciplina, distribuição semanal, progresso geral e métricas que ajudam a otimizar sua rotina de estudos.',
    position: 'bottom',
    view: 'estatisticas'
  },
  {
    id: 'gamificacao',
    target: '[data-tutorial="gamificacao-content"]',
    title: 'Jornada do Herói',
    description: 'Acompanhe sua gamificação! Ganhe XP, desbloqueie badges e mantenha sua sequência de dias estudados. A gamificação torna seus estudos mais motivadores e divertidos.',
    position: 'bottom',
    view: 'gamificacao'
  },
  {
    id: 'corretor',
    target: '[data-tutorial="corretor-content"]',
    title: 'Corretor de Redação',
    description: 'Use o corretor de redação para praticar suas redações. O sistema analisa seu texto e fornece feedback detalhado, ajudando você a melhorar sua escrita e argumentação.',
    position: 'bottom',
    view: 'corretor'
  }
];

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ isOpen, onComplete, onSkip, setActiveView }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isNavigating, setIsNavigating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  useEffect(() => {
    if (!isOpen || !step) return;

    // Navegar para a view necessária se especificada
    if (step.view && setActiveView) {
      setIsNavigating(true);
      setActiveView(step.view);
      // Aguardar navegação e renderização
      setTimeout(() => {
        setIsNavigating(false);
      }, 300);
    }

    const updateHighlight = () => {
      // Aguardar um pouco para garantir que a navegação e renderização terminaram
      const element = document.querySelector(step.target);
      if (element && element.isConnected) {
        const rect = element.getBoundingClientRect();
        // Verificar se o elemento está visível
        const styles = window.getComputedStyle(element);
        const isVisible = styles.display !== 'none' && 
                         styles.visibility !== 'hidden' && 
                         styles.opacity !== '0' &&
                         rect.width > 0 && 
                         rect.height > 0;
        
        if (isVisible) {
          setHighlightPosition({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });

          // Scroll para o elemento se necessário
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Se o elemento não estiver visível, usar posição central
          setHighlightPosition({
            top: window.innerHeight / 2,
            left: window.innerWidth / 2,
            width: 0,
            height: 0
          });
        }
      } else {
        // Se o elemento não for encontrado, usar posição central
        setHighlightPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
          width: 0,
          height: 0
        });
      }
    };

    // Aguardar mais tempo se estiver navegando
    const delay = isNavigating ? 600 : 300;
    const timeout = setTimeout(updateHighlight, delay);
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [isOpen, currentStep, step, isNavigating, setActiveView]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen || !step) return null;

  // Calcular posição do tooltip baseado na posição do step
  const getTooltipStyle = () => {
    const gap = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (step.position) {
      case 'right':
        return {
          top: `${highlightPosition.top}px`,
          left: `${highlightPosition.left + highlightPosition.width + gap}px`,
        };
      case 'left':
        return {
          top: `${highlightPosition.top}px`,
          left: `${highlightPosition.left - tooltipWidth - gap}px`,
        };
      case 'bottom':
        return {
          top: `${highlightPosition.top + highlightPosition.height + gap}px`,
          left: `${highlightPosition.left + (highlightPosition.width / 2) - (tooltipWidth / 2)}px`,
        };
      case 'top':
        return {
          top: `${highlightPosition.top - tooltipHeight - gap}px`,
          left: `${highlightPosition.left + (highlightPosition.width / 2) - (tooltipWidth / 2)}px`,
        };
      default:
        return {
          top: `${highlightPosition.top + highlightPosition.height + gap}px`,
          left: `${highlightPosition.left + (highlightPosition.width / 2) - (tooltipWidth / 2)}px`,
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay escuro com blur - usando múltiplas camadas para criar o efeito de "buraco" */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] pointer-events-none"
          >
            {/* Overlay superior */}
            <div
              className="absolute bg-black/70 backdrop-blur-sm"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: `${Math.max(0, highlightPosition.top)}px`,
              }}
            />
            {/* Overlay esquerdo */}
            <div
              className="absolute bg-black/70 backdrop-blur-sm"
              style={{
                top: `${Math.max(0, highlightPosition.top)}px`,
                left: 0,
                width: `${highlightPosition.left}px`,
                height: `${highlightPosition.height}px`,
              }}
            />
            {/* Overlay direito */}
            <div
              className="absolute bg-black/70 backdrop-blur-sm"
              style={{
                top: `${Math.max(0, highlightPosition.top)}px`,
                left: `${highlightPosition.left + highlightPosition.width}px`,
                right: 0,
                height: `${highlightPosition.height}px`,
              }}
            />
            {/* Overlay inferior */}
            <div
              className="absolute bg-black/70 backdrop-blur-sm"
              style={{
                top: `${Math.max(0, highlightPosition.top + highlightPosition.height)}px`,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          </motion.div>

          {/* Highlight do elemento */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed z-[9999] border-4 border-primary rounded-lg shadow-2xl shadow-primary/50 pointer-events-none"
            style={{
              top: `${highlightPosition.top}px`,
              left: `${highlightPosition.left}px`,
              width: `${highlightPosition.width}px`,
              height: `${highlightPosition.height}px`,
              boxShadow: '0 0 0 4px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3)'
            }}
          />

          {/* Tooltip com informações */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed z-[10000] bg-card border-2 border-primary rounded-xl shadow-2xl p-6 max-w-sm"
            style={getTooltipStyle()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              <button
                onClick={onSkip}
                className="ml-4 p-1 hover:bg-muted rounded-md transition-colors"
                aria-label="Fechar tutorial"
              >
                <XIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1} de {tutorialSteps.length}
                </span>
                <div className="flex gap-1">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-1"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    Anterior
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 text-sm font-bold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  {isLastStep ? 'Concluir' : 'Próximo'}
                  {!isLastStep && <ChevronRightIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={onSkip}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Pular tutorial
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

