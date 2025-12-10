import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2Icon, SparklesIcon, ChevronDownIcon, TargetIcon } from './icons';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { toast } from './Sonner';
import { useNavigate } from 'react-router-dom';

type BillingPeriod = 'monthly' | 'yearly';

interface Plan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  cta: string;
  ctaStyle: 'outline' | 'solid';
  tag?: string;
  color: string;
  yearlyDiscount?: number;
  isPremium?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Pro',
    monthlyPrice: 29.90,
    yearlyPrice: 251.16, // 30% de desconto (R$ 29.90 * 12 * 0.7)
    features: [
      '3 Editais e Planos',
      '1 Ciclo de Estudos Adaptativo',
      'Sistema de Revisão (SRS) Automático',
      '4 Correções de Redação IA/mês'
    ],
    cta: 'Começar Teste Grátis',
    ctaStyle: 'outline',
    color: 'bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 border-primary/30 dark:border-primary/50',
    yearlyDiscount: 30
  },
  {
    name: 'Premium',
    monthlyPrice: 49.90,
    yearlyPrice: 419.16, // 30% de desconto (R$ 49.90 * 12 * 0.7)
    features: [
      'Tudo do Pro +',
      'Editais e Planos Ilimitados',
      'Ciclos de Estudos Ilimitados',
      'Correção de Redação IA ILIMITADA',
      'Gráficos de Pontos Fracos',
      'Upload de Redação Manuscrita (OCR)',
      'Suporte Prioritário'
    ],
    cta: 'Começar Teste Premium',
    ctaStyle: 'solid',
    tag: 'Acesso Total no Teste',
    color: 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-500/20 dark:to-yellow-500/20 border-amber-300 dark:border-amber-500/50',
    yearlyDiscount: 30,
    isPremium: true
  }
];

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'Como funciona o período de teste de 7 dias?',
    answer: 'Você tem 7 dias completos para testar todos os recursos do plano escolhido sem precisar informar cartão de crédito. Após esse período, sua conta bloqueia os recursos pagos, mas nenhuma cobrança automática será feita. Você só será cobrado se decidir ativar a assinatura.'
  },
  {
    question: 'Preciso informar cartão de crédito para começar o teste?',
    answer: 'Não! O teste é 100% gratuito e não requer cartão de crédito. Você pode experimentar todos os recursos sem compromisso.'
  },
  {
    question: 'O que acontece após os 7 dias de teste?',
    answer: 'Após 7 dias, sua conta bloqueia os recursos pagos automaticamente. Nenhuma cobrança será feita. Você só será cobrado se decidir ativar a assinatura manualmente.'
  },
  {
    question: 'Posso cancelar a assinatura a qualquer momento?',
    answer: 'Sim! Você pode cancelar sua assinatura a qualquer momento através das configurações da sua conta. O cancelamento será efetivado no final do período já pago, e você continuará tendo acesso aos recursos até o término do período.'
  },
  {
    question: 'Posso mudar de plano a qualquer momento?',
    answer: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Ao fazer upgrade, o novo plano será ativado imediatamente. Ao fazer downgrade, as mudanças serão aplicadas no próximo ciclo de cobrança.'
  },
  {
    question: 'Posso usar o plano em múltiplos dispositivos?',
    answer: 'Sim! Sua assinatura permite acesso em múltiplos dispositivos simultaneamente. Você pode estudar no computador, tablet e celular sem restrições.'
  },
  {
    question: 'Os preços podem mudar?',
    answer: 'Se você já é assinante, seu preço atual será mantido mesmo se houver aumentos futuros. Novos preços se aplicam apenas a novas assinaturas ou renovações após mudanças de plano.'
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'Aceitamos cartão de crédito, débito e PIX. Para planos anuais, também oferecemos boleto bancário. Todos os pagamentos são processados de forma segura através de gateways de pagamento certificados.'
  }
];

const PaymentPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  const { startTrial, loading: subscriptionLoading } = useSubscriptionStore();
  const navigate = useNavigate();
  const [startingTrial, setStartingTrial] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(price);
  };

  const calculateMonthlyEquivalent = (yearlyPrice: number) => {
    return yearlyPrice / 12;
  };

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const yearlyTotal = monthlyPrice * 12;
    return yearlyTotal - yearlyPrice;
  };

  const handleStartTrial = async (planName: string) => {
    const planType = planName.toLowerCase() === 'premium' ? 'premium' : 'pro';
    setStartingTrial(planName);

    try {
      await startTrial(planType);
      toast.success(`Teste grátis de 7 dias iniciado! Bem-vindo ao plano ${planName}!`);
      // Redirecionar para o dashboard após iniciar o trial
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao iniciar trial:', error);
      toast.error(error.message || 'Não foi possível iniciar o teste grátis. Tente novamente.');
    } finally {
      setStartingTrial(null);
    }
  };

  return (
    <div className="space-y-12 pb-8">
      {/* Header / Banner Promocional */}
      <div className="flex flex-col gap-4 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Experimente o Eleva Premium por 7 dias
          </h1>
          <p className="text-xl font-semibold text-primary dark:text-primary/90 mb-2">
            Sem cartão de crédito necessário. Sem compromisso.
          </p>
          <p className="text-muted-foreground text-lg">
            Teste todos os recursos sem se preocupar. Após 7 dias, você decide se quer continuar.
          </p>
        </motion.div>

        {/* Toggle Mensal/Anual */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <span className={`text-base font-medium transition-colors ${billingPeriod === 'monthly' ? 'text-white' : 'text-muted-foreground'}`}>
            Mensal
          </span>
          <div className="flex flex-col items-center gap-3 relative">
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative h-10 w-20 rounded-full p-1.5 transition-all duration-300 focus:outline-none ${billingPeriod === 'yearly'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 ring-2 ring-purple-500 ring-offset-4 ring-offset-background shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                : 'bg-zinc-800 ring-2 ring-zinc-700'
                }`}
            >
              <div className={`flex w-full h-full items-center ${billingPeriod === 'yearly' ? 'justify-end' : 'justify-start'}`}>
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="h-7 w-7 rounded-full bg-white shadow-lg"
                />
              </div>
            </button>
            <div className="absolute top-full mt-4 w-max">
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1.5 bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm"
              >
                <TargetIcon className="w-3 h-3" />
                Economize 30%
              </motion.span>
            </div>
          </div>
          <span className={`text-base font-medium transition-colors ${billingPeriod === 'yearly' ? 'text-white' : 'text-muted-foreground'}`}>
            Anual
          </span>
        </div>
      </div>

      {/* Cards dos Planos - 2 Colunas */}
      <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
        {plans.map((plan, index) => {
          const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const monthlyEquivalent = billingPeriod === 'yearly' && plan.yearlyPrice > 0
            ? calculateMonthlyEquivalent(plan.yearlyPrice)
            : plan.monthlyPrice;
          const savings = billingPeriod === 'yearly' && plan.yearlyPrice > 0
            ? calculateSavings(plan.monthlyPrice, plan.yearlyPrice)
            : 0;

          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`relative rounded-2xl border p-6 lg:p-8 ${plan.color} backdrop-blur-sm flex flex-col hover:border-opacity-50 dark:hover:border-white/20 transition-all duration-300 ${plan.isPremium ? 'scale-105 lg:scale-110 z-10 shadow-2xl' : ''
                }`}
            >
              {/* Tag do Premium */}
              {plan.tag && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold px-4 py-1 rounded-full text-sm shadow-lg shadow-amber-500/30">
                  {plan.tag}
                </div>
              )}

              {/* Badge de desconto anual */}
              {billingPeriod === 'yearly' && plan.yearlyDiscount && (
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white font-bold px-3 py-1 rounded-full text-xs shadow-lg">
                  {plan.yearlyDiscount}% OFF
                </div>
              )}

              {/* Header do Card */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-4">{plan.name}</h3>
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-foreground">
                      {formatPrice(billingPeriod === 'yearly' ? monthlyEquivalent : price)}
                    </span>
                    <span className="text-muted-foreground text-lg">/mês</span>
                  </div>
                  {billingPeriod === 'yearly' && plan.yearlyPrice > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(plan.monthlyPrice)}/mês
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">
                          ou {formatPrice(plan.yearlyPrice)}/ano
                        </span>
                        {savings > 0 && (
                          <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-500/20 px-2 py-0.5 rounded">
                            Economize {formatPrice(savings)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {billingPeriod === 'monthly' && plan.monthlyPrice > 0 && (
                    <span className="text-sm text-muted-foreground mt-1">
                      cobrado mensalmente
                    </span>
                  )}
                </div>
              </div>

              {/* Lista de Recursos */}
              <div className="flex-1 space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle2Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/90 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Botão CTA */}
              <div className="space-y-2">
                <button
                  onClick={() => handleStartTrial(plan.name)}
                  disabled={startingTrial !== null || subscriptionLoading}
                  className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${plan.ctaStyle === 'solid'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:opacity-90 shadow-lg shadow-amber-500/30'
                    : 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/20'
                    }`}
                >
                  {startingTrial === plan.name ? 'Iniciando...' : plan.cta}
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  Não pede cartão agora
                </p>
              </div>

              {/* Rodapé do Card */}
              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-white/10">
                <p className="text-xs text-center text-muted-foreground italic">
                  *Após 7 dias, sua conta bloqueia recursos pagos. Nenhuma cobrança automática será feita.
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Informações adicionais sobre plano anual */}
      {billingPeriod === 'yearly' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mt-12 p-6 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
            Por que escolher o plano anual?
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Economia de 30%</p>
                <p className="text-muted-foreground">Pague menos e estude mais</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Sem surpresas</p>
                <p className="text-muted-foreground">Preço fixo por 12 meses</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Foco total</p>
                <p className="text-muted-foreground">Menos preocupações, mais estudos</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Seção FAQ */}
      <div className="max-w-4xl mx-auto mt-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Perguntas Frequentes</h2>
          <p className="text-muted-foreground">Tire suas dúvidas sobre o teste gratuito e assinaturas</p>
        </div>

        <div className="space-y-3">
          {faqData.map((faq, index) => {
            const isOpen = openFAQIndex === index;
            return (
              <motion.div
                key={index}
                initial={false}
                className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 backdrop-blur-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQIndex(isOpen ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDownIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 pt-0">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
