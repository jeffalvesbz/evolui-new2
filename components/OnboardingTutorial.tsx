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
  const [elementFound, setElementFound] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 8; // Reduzir tentativas para resposta mais rápida

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  useEffect(() => {
    if (!isOpen || !step) return;

    // Reset retry count quando mudar de step
    retryCountRef.current = 0;
    setElementFound(true);

    // Navegar para a view necessária se especificada
    if (step.view && setActiveView) {
      setIsNavigating(true);
      setActiveView(step.view);
      // Reduzir delay de navegação para resposta mais rápida
      setTimeout(() => {
        setIsNavigating(false);
      }, 200);
    }

    const findAndHighlightElement = (attempt: number = 0): void => {
      const element = document.querySelector(step.target) as HTMLElement;
      
      if (element && element.isConnected) {
        // Usar requestAnimationFrame duplo para garantir que o DOM está atualizado após navegação
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const rect = element.getBoundingClientRect();
            const styles = window.getComputedStyle(element);
            
            // Verificar se o elemento está visível e tem dimensões válidas
            // Remover verificação de rect.top !== 0 e rect.left !== 0 que pode ser muito restritiva
            const isVisible = styles.display !== 'none' && 
                             styles.visibility !== 'hidden' && 
                             styles.opacity !== '0' &&
                             rect.width > 0 && 
                             rect.height > 0;
            
            if (isVisible) {
              // Adicionar padding ao highlight para melhor visualização
              const padding = 4;
              setHighlightPosition({
                top: rect.top - padding,
                left: rect.left - padding,
                width: rect.width + (padding * 2),
                height: rect.height + (padding * 2)
              });
              setElementFound(true);
              retryCountRef.current = 0;

              // Scroll para o elemento de forma mais rápida
              requestAnimationFrame(() => {
                element.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center',
                  inline: 'center'
                });
              });
            } else if (attempt < maxRetries) {
              // Tentar novamente mais rapidamente
              const retryDelay = attempt < 3 ? 50 : attempt < 6 ? 100 : 150;
              setTimeout(() => findAndHighlightElement(attempt + 1), retryDelay);
            } else {
              // Se não conseguir encontrar após várias tentativas, usar posição central
              setHighlightPosition({
                top: window.innerHeight / 2,
                left: window.innerWidth / 2,
                width: 0,
                height: 0
              });
              setElementFound(false);
            }
          });
        });
      } else if (attempt < maxRetries) {
        // Tentar novamente mais rapidamente
        const retryDelay = attempt < 3 ? 50 : attempt < 6 ? 100 : 150;
        setTimeout(() => findAndHighlightElement(attempt + 1), retryDelay);
      } else {
        // Se não conseguir encontrar após várias tentativas, usar posição central
        setHighlightPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
          width: 0,
          height: 0
        });
        setElementFound(false);
      }
    };

    // Reduzir delays significativamente para resposta mais rápida
    const delay = isNavigating ? 250 : 100;
    const timeout = setTimeout(() => {
      findAndHighlightElement(0);
    }, delay);

    // Função para atualizar highlight em eventos de resize/scroll
    const updateHighlight = () => {
      retryCountRef.current = 0;
      findAndHighlightElement(0);
    };

    // Usar debounce para resize e scroll para melhor performance
    let resizeTimeout: NodeJS.Timeout;
    let scrollTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateHighlight, 150);
    };

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateHighlight, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeout);
      clearTimeout(resizeTimeout);
      clearTimeout(scrollTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, currentStep, step, isNavigating, setActiveView]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      // Pré-navegar para a próxima view se necessário para acelerar
      const nextStep = tutorialSteps[currentStep + 1];
      if (nextStep?.view && setActiveView && nextStep.view !== step?.view) {
        setActiveView(nextStep.view);
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // Pré-navegar para a view anterior se necessário
      const prevStep = tutorialSteps[currentStep - 1];
      if (prevStep?.view && setActiveView && prevStep.view !== step?.view) {
        setActiveView(prevStep.view);
      }
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen || !step) return null;

  // Calcular posição do tooltip baseado na posição do step e tamanho da tela
  const getTooltipStyle = () => {
    const gap = 16;
    const isMobile = window.innerWidth < 768;
    const tooltipWidth = isMobile ? Math.min(320, window.innerWidth - 32) : 360;
    const tooltipHeight = isMobile ? 250 : 200;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16;

    // Função para calcular posição segura
    const calculatePosition = (preferredPosition: { top: number; left: number }) => {
      let { top, left } = preferredPosition;

      // Garantir que não saia da tela horizontalmente
      if (left < padding) {
        left = padding;
      } else if (left + tooltipWidth > viewportWidth - padding) {
        left = viewportWidth - tooltipWidth - padding;
      }

      // Garantir que não saia da tela verticalmente
      if (top < padding) {
        top = padding;
      } else if (top + tooltipHeight > viewportHeight - padding) {
        top = viewportHeight - tooltipHeight - padding;
      }

      // Em mobile, centralizar horizontalmente se o elemento for muito grande
      if (isMobile && highlightPosition.width > viewportWidth * 0.8) {
        left = (viewportWidth - tooltipWidth) / 2;
      }

      return { top: `${top}px`, left: `${left}px`, width: `${tooltipWidth}px` };
    };

    // Em mobile, sempre usar posição bottom ou center
    if (isMobile) {
      const spaceBelow = viewportHeight - (highlightPosition.top + highlightPosition.height);
      const spaceAbove = highlightPosition.top;

      if (spaceBelow >= tooltipHeight + gap) {
        // Colocar abaixo
        return calculatePosition({
          top: highlightPosition.top + highlightPosition.height + gap,
          left: (viewportWidth - tooltipWidth) / 2,
        });
      } else if (spaceAbove >= tooltipHeight + gap) {
        // Colocar acima
        return calculatePosition({
          top: highlightPosition.top - tooltipHeight - gap,
          left: (viewportWidth - tooltipWidth) / 2,
        });
      } else {
        // Centralizar na tela
        return calculatePosition({
          top: (viewportHeight - tooltipHeight) / 2,
          left: (viewportWidth - tooltipWidth) / 2,
        });
      }
    }

    // Desktop: usar posição preferida do step
    switch (step.position) {
      case 'right': {
        const rightSpace = viewportWidth - (highlightPosition.left + highlightPosition.width);
        if (rightSpace >= tooltipWidth + gap) {
          return calculatePosition({
            top: highlightPosition.top,
            left: highlightPosition.left + highlightPosition.width + gap,
          });
        }
        // Se não há espaço à direita, tentar à esquerda
        const leftSpace = highlightPosition.left;
        if (leftSpace >= tooltipWidth + gap) {
          return calculatePosition({
            top: highlightPosition.top,
            left: highlightPosition.left - tooltipWidth - gap,
          });
        }
        // Se não há espaço em nenhum lado, colocar abaixo
        return calculatePosition({
          top: highlightPosition.top + highlightPosition.height + gap,
          left: highlightPosition.left + (highlightPosition.width / 2) - (tooltipWidth / 2),
        });
      }
      case 'left': {
        const leftSpace = highlightPosition.left;
        if (leftSpace >= tooltipWidth + gap) {
          return calculatePosition({
            top: highlightPosition.top,
            left: highlightPosition.left - tooltipWidth - gap,
          });
        }
        // Se não há espaço à esquerda, tentar à direita
        const rightSpace = viewportWidth - (highlightPosition.left + highlightPosition.width);
        if (rightSpace >= tooltipWidth + gap) {
          return calculatePosition({
            top: highlightPosition.top,
            left: highlightPosition.left + highlightPosition.width + gap,
          });
        }
        // Se não há espaço em nenhum lado, colocar abaixo
        return calculatePosition({
          top: highlightPosition.top + highlightPosition.height + gap,
          left: highlightPosition.left + (highlightPosition.width / 2) - (tooltipWidth / 2),
        });
      }
      case 'bottom': {
        const spaceBelow = viewportHeight - (highlightPosition.top + highlightPosition.height);
        if (spaceBelow >= tooltipHeight + gap) {
          return calculatePosition({
            top: highlightPosition.top + highlightPosition.height + gap,
            left: highlightPosition.left + (highlightPosition.width / 2) - (tooltipWidth / 2),
          });
        }
        // Se não há espaço abaixo, colocar acima
        const spaceAbove = highlightPosition.top;
        if (spaceAbove >= tooltipHeight + gap) {
          return calculatePosition({
            top: highlightPosition.top - tooltipHeight - gap,
            left: highlightPosition.left + (highlightPosition.width / 2) - (tooltipWidth / 2),
          });
        }
        // Último recurso: centralizar
        return calculatePosition({
          top: (viewportHeight - tooltipHeight) / 2,
          left: (viewportWidth - tooltipWidth) / 2,
        });
      }
      case 'top': {
        const spaceAbove = highlightPosition.top;
        if (spaceAbove >= tooltipHeight + gap) {
          return calculatePosition({
            top: highlightPosition.top - tooltipHeight - gap,
            left: highlightPosition.left + (highlightPosition.width / 2) - (tooltipWidth / 2),
          });
        }
        // Se não há espaço acima, colocar abaixo
        const spaceBelow = viewportHeight - (highlightPosition.top + highlightPosition.height);
        if (spaceBelow >= tooltipHeight + gap) {
          return calculatePosition({
            top: highlightPosition.top + highlightPosition.height + gap,
            left: highlightPosition.left + (highlightPosition.width / 2) - (tooltipWidth / 2),
          });
        }
        // Último recurso: centralizar
        return calculatePosition({
          top: (viewportHeight - tooltipHeight) / 2,
          left: (viewportWidth - tooltipWidth) / 2,
        });
      }
      default:
        return calculatePosition({
          top: highlightPosition.top + highlightPosition.height + gap,
          left: highlightPosition.left + (highlightPosition.width / 2) - (tooltipWidth / 2),
        });
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
              className="absolute bg-black/50 backdrop-blur-[2px] pointer-events-auto"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: `${Math.max(0, highlightPosition.top)}px`,
              }}
            />
            {/* Overlay esquerdo */}
            <div
              className="absolute bg-black/50 backdrop-blur-[2px] pointer-events-auto"
              style={{
                top: `${Math.max(0, highlightPosition.top)}px`,
                left: 0,
                width: `${highlightPosition.left}px`,
                height: `${highlightPosition.height}px`,
              }}
            />
            {/* Overlay direito */}
            <div
              className="absolute bg-black/50 backdrop-blur-[2px] pointer-events-auto"
              style={{
                top: `${Math.max(0, highlightPosition.top)}px`,
                left: `${highlightPosition.left + highlightPosition.width}px`,
                right: 0,
                height: `${highlightPosition.height}px`,
              }}
            />
            {/* Overlay inferior */}
            <div
              className="absolute bg-black/50 backdrop-blur-[2px] pointer-events-auto"
              style={{
                top: `${Math.max(0, highlightPosition.top + highlightPosition.height)}px`,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          </motion.div>

          {/* Área clicável no elemento destacado - permite interação */}
          {highlightPosition.width > 0 && highlightPosition.height > 0 && (
            <>
              {/* Área que permite cliques passarem para o elemento abaixo */}
              <div
                className="fixed z-[9999] pointer-events-none"
                style={{
                  top: `${Math.max(0, highlightPosition.top)}px`,
                  left: `${Math.max(0, highlightPosition.left)}px`,
                  width: `${Math.max(0, highlightPosition.width)}px`,
                  height: `${Math.max(0, highlightPosition.height)}px`,
                }}
              />
              {/* Highlight visual do elemento */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="fixed z-[9998] border-2 md:border-4 border-primary rounded-lg shadow-2xl shadow-primary/50 pointer-events-none"
                style={{
                  top: `${Math.max(0, highlightPosition.top)}px`,
                  left: `${Math.max(0, highlightPosition.left)}px`,
                  width: `${Math.max(0, highlightPosition.width)}px`,
                  height: `${Math.max(0, highlightPosition.height)}px`,
                  boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.4)'
                }}
              />
            </>
          )}

          {/* Tooltip com informações */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed z-[10000] bg-card border-2 border-primary rounded-xl shadow-2xl p-4 md:p-6 mx-auto pointer-events-auto"
            style={getTooltipStyle()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="flex-1 pr-2">
                <h3 className="text-base md:text-lg font-bold text-foreground mb-1 md:mb-2">{step.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              <button
                onClick={onSkip}
                className="flex-shrink-0 ml-2 p-1 hover:bg-muted rounded-md transition-colors"
                aria-label="Fechar tutorial"
              >
                <XIcon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-0 mt-4 md:mt-6">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {currentStep + 1} de {tutorialSteps.length}
                </span>
                <div className="flex gap-1 overflow-x-auto">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all flex-shrink-0 ${
                        index === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-3 py-1.5 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-1 flex-shrink-0"
                  >
                    <ChevronLeftIcon className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-bold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  {isLastStep ? 'Concluir' : <><span className="hidden sm:inline">Próximo</span><span className="sm:hidden">Próx</span></>}
                  {!isLastStep && <ChevronRightIcon className="w-3 h-3 md:w-4 md:h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={onSkip}
              className="mt-3 md:mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors underline text-center w-full"
            >
              Pular tutorial
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

