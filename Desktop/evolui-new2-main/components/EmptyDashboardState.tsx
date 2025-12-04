import React from 'react';
import { motion } from 'framer-motion';
import { LandmarkIcon, SparklesIcon, ArrowRightIcon, TargetIcon } from './icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '../lib/dashboardMocks';
import { useModalStore } from '../stores/useModalStore';

interface EmptyDashboardStateProps {
  onCreateEdital: () => void;
}

const EmptyDashboardState: React.FC<EmptyDashboardStateProps> = ({ onCreateEdital }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="border-primary/30 overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary/20 via-background/0 to-secondary/10 p-8 sm:p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <LandmarkIcon className="w-10 h-10 text-black" />
          </motion.div>
          <CardDescription className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary mb-4">
            <SparklesIcon className="h-4 w-4" />
            Bem-vindo ao Evolui
          </CardDescription>
          <CardTitle className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground via-primary to-secondary mb-4">
            Comece sua jornada de estudos
          </CardTitle>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Crie seu primeiro plano de estudos e organize sua rotina de forma inteligente.
            Você está a poucos passos de começar!
          </p>
        </CardHeader>
        <CardContent className="p-8 sm:p-12">
          <div className="space-y-6">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={onCreateEdital}
              className="w-full sm:w-auto mx-auto flex items-center justify-center gap-3 h-14 px-8 rounded-xl bg-gradient-to-r from-primary to-secondary text-black text-base font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all hover:scale-105"
            >
              <TargetIcon className="w-5 h-5" />
              Criar meu primeiro plano de estudos
              <ArrowRightIcon className="w-5 h-5" />
            </motion.button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-lg border border-border bg-background/30 text-center"
              >
                <div className="text-2xl font-bold text-primary mb-2">1</div>
                <h3 className="font-semibold text-sm mb-1">Crie seu plano</h3>
                <p className="text-xs text-muted-foreground">Defina seu edital e data alvo</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 rounded-lg border border-border bg-background/30 text-center"
              >
                <div className="text-2xl font-bold text-primary mb-2">2</div>
                <h3 className="font-semibold text-sm mb-1">Adicione disciplinas</h3>
                <p className="text-xs text-muted-foreground">Organize suas matérias e tópicos</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-4 rounded-lg border border-border bg-background/30 text-center"
              >
                <div className="text-2xl font-bold text-primary mb-2">3</div>
                <h3 className="font-semibold text-sm mb-1">Comece a estudar</h3>
                <p className="text-xs text-muted-foreground">Registre suas sessões e acompanhe</p>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmptyDashboardState;


