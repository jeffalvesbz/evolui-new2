import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2Icon, ChevronDownIcon, TrophyIcon, StarIcon, LockIcon, ZapIcon, XIcon, CrownIcon, RefreshCwIcon, ArrowRightIcon, ShieldCheckIcon } from './icons';
import { toast } from './Sonner';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession, createPortalSession } from '../services/stripeService';
import { supabase } from '../services/supabaseClient';
import { plans, Plan } from '../src/config/plans';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';

type BillingPeriod = 'monthly' | 'yearly';

interface FAQItem {
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        question: 'Qual a política de reembolso?',
        answer: 'De acordo com o Código de Defesa do Consumidor (Art. 49), você tem 7 dias para desistir da compra e receber reembolso integral, sem necessidade de justificativa. Basta entrar em contato conosco.'
    },
    {
        question: 'Preciso informar cartão de crédito?',
        answer: 'Sim, para iniciar sua assinatura. Lembre-se: você tem 7 dias de garantia para solicitar reembolso caso não fique satisfeito.'
    },
    {
        question: 'Posso cancelar a qualquer momento?',
        answer: 'Sim! Cancele através das configurações ou do portal do cliente. O cancelamento é efetivado no final do período pago.'
    },
    {
        question: 'Qual a diferença entre Pro e Premium?',
        answer: 'Pro tem limites (3 editais, 10 correções/mês, 30 questões IA/dia). Premium oferece recursos ilimitados, 100 questões IA/dia, OCR de redação manuscrita e suporte prioritário 24/7.'
    },
    {
        question: 'O desconto de 30% no plano anual é permanente?',
        answer: 'Sim! O desconto é aplicado automaticamente no plano anual e se mantém em todas as renovações.'
    },
    {
        question: 'Como funciona a garantia de 7 dias?',
        answer: 'Se por qualquer motivo você não ficar satisfeito nos primeiros 7 dias, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia.'
    }
];

const comparisonData = [
    { feature: 'Editais e Planos', free: '1', pro: '3', premium: '∞' },
    { feature: 'Ciclos de Estudos', free: '1', pro: '3', premium: '∞' },
    { feature: 'Correções IA/mês', free: '0', pro: '10', premium: '∞' },
    { feature: 'Questões IA/dia', free: '0', pro: '30', premium: '100' },
    { feature: 'Flashcards/mês', free: '50', pro: '500', premium: '2000' },
    { feature: 'OCR Redação', free: '✗', pro: '✗', premium: '✓' },
    { feature: 'Suporte Prioritário', free: '✗', pro: '✗', premium: '✓' },
];

const PaymentPageStripe: React.FC = () => {
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
    const [startingTrial, setStartingTrial] = useState<string | null>(null);
    const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
    const [openingPortal, setOpeningPortal] = useState(false);
    const navigate = useNavigate();

    const {
        planType,
        hasActiveSubscription,
        isTrialActive,
        fetchSubscription,
        subscriptionEndsAt
    } = useSubscriptionStore();

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const currentPlanIsActive = hasActiveSubscription() || isTrialActive();
    const isPro = planType === 'pro' && currentPlanIsActive;
    const isPremium = planType === 'premium' && currentPlanIsActive;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(price);
    };

    const handleStartTrial = async (planName: string) => {
        const planType = planName.toLowerCase() === 'premium' ? 'premium' : 'pro';
        setStartingTrial(planName);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Você precisa estar logado');
                navigate('/login');
                return;
            }
            await createCheckoutSession(planType, billingPeriod, user.id);
        } catch (error: any) {
            console.error('Erro:', error);
            toast.error('Erro ao processar pagamento');
            setStartingTrial(null);
        }
    };

    const handleOpenPortal = async () => {
        setOpeningPortal(true);
        try {
            await createPortalSession();
        } catch (error: any) {
            console.error('Erro:', error);
            toast.error('Erro ao abrir portal de gerenciamento');
            setOpeningPortal(false);
        }
    };

    const getButtonState = (planName: string): { disabled: boolean; text: string; variant: 'current' | 'upgrade' | 'downgrade' | 'available' } => {
        const targetPlan = planName.toLowerCase() as 'pro' | 'premium';

        if (!currentPlanIsActive) {
            return { disabled: false, text: 'Começar Agora', variant: 'available' };
        }

        if (planType === targetPlan) {
            return { disabled: true, text: '✓ Plano Atual', variant: 'current' };
        }

        if (planType === 'premium' && targetPlan === 'pro') {
            return { disabled: true, text: 'Downgrade não disponível', variant: 'downgrade' };
        }

        if (planType === 'pro' && targetPlan === 'premium') {
            return { disabled: false, text: 'Fazer Upgrade', variant: 'upgrade' };
        }

        return { disabled: false, text: 'Começar Agora', variant: 'available' };
    };

    const renderSubscriptionAlert = () => {
        if (!currentPlanIsActive) return null;

        const trialText = isTrialActive() ? ' (Período de teste)' : '';
        const planLabel = planType === 'premium' ? 'Premium' : 'Pro';

        if (isPremium) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto mb-8"
                >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-2 border-amber-500/30 p-6 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 animate-pulse" />
                        <div className="relative flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                                <CrownIcon className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-xl font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
                                    🎉 Você já tem o {planLabel}{trialText}!
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Você está aproveitando todos os recursos premium. Obrigado por fazer parte!
                                </p>
                            </div>
                            <button
                                onClick={handleOpenPortal}
                                disabled={openingPortal}
                                className="px-5 py-2.5 rounded-xl border-2 border-amber-500/50 text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-500/10 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {openingPortal ? (
                                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ZapIcon className="w-4 h-4" />
                                )}
                                Gerenciar Assinatura
                            </button>
                        </div>
                    </div>
                </motion.div>
            );
        }

        if (isPro) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto mb-8"
                >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-2 border-primary/30 p-6 backdrop-blur-sm">
                        <div className="relative flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
                                <StarIcon className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-xl font-bold text-foreground">
                                    Você é {planLabel}{trialText}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Desbloqueie recursos ilimitados fazendo upgrade para o <span className="text-primary font-semibold">Premium</span>!
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => document.querySelector('[data-plan="Premium"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/30"
                                >
                                    <ArrowRightIcon className="w-4 h-4" />
                                    Upgrade para Premium
                                </button>
                                <button
                                    onClick={handleOpenPortal}
                                    disabled={openingPortal}
                                    className="px-4 py-2.5 rounded-xl border-2 border-border hover:bg-muted/50 transition-all disabled:opacity-50"
                                >
                                    {openingPortal ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : 'Gerenciar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            );
        }

        return null;
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-16">
            {/* Alert for existing subscribers */}
            {renderSubscriptionAlert()}

            {/* Header */}
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-full text-emerald-600 dark:text-emerald-400 text-sm font-bold shadow-lg"
                >
                    <ShieldCheckIcon className="w-4 h-4" />
                    <span>Garantia de 7 Dias - Código de Defesa do Consumidor</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-bold text-foreground"
                >
                    Evolua com o <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Premium</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-muted-foreground max-w-2xl mx-auto"
                >
                    Satisfação garantida ou seu dinheiro de volta em até 7 dias
                </motion.p>

                {/* Badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-wrap items-center justify-center gap-3 pt-2"
                >
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                        <LockIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Pagamento 100% Seguro</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
                        <ShieldCheckIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">7 Dias de Garantia</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full">
                        <TrophyIcon className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">+10.000 Estudantes</span>
                    </div>
                </motion.div>

                {/* Toggle */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-4 pt-4"
                >
                    <span className={`text-sm font-semibold ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Mensal
                    </span>
                    <button
                        onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                        className={`relative h-9 w-16 rounded-full p-1 transition-all ${billingPeriod === 'yearly' ? 'bg-gradient-to-r from-primary to-secondary shadow-lg' : 'bg-zinc-700'
                            }`}
                    >
                        <motion.div
                            layout
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`h-7 w-7 rounded-full bg-white shadow-lg ${billingPeriod === 'yearly' ? 'ml-auto' : ''}`}
                        />
                    </button>
                    <span className={`text-sm font-semibold ${billingPeriod === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Anual <span className="text-emerald-500 font-bold">-30%</span>
                    </span>
                </motion.div>
            </div>

            {/* Cards dos Planos */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {plans.map((plan, index) => {
                    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice / 12;
                    const savings = billingPeriod === 'yearly' ? (plan.monthlyPrice * 12 - plan.yearlyPrice) : 0;
                    const totalYearly = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice * 12;
                    const buttonState = getButtonState(plan.name);

                    return (
                        <motion.div
                            key={plan.name}
                            data-plan={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 + index * 0.1 }}
                            className={`relative rounded-2xl border-2 p-6 backdrop-blur-sm ${plan.color} ${plan.isPremium ? 'ring-2 ring-primary/60 shadow-2xl shadow-primary/20 md:scale-105' : 'shadow-lg'
                                } hover:shadow-xl transition-all duration-300 ${buttonState.variant === 'current' ? 'ring-2 ring-emerald-500/50' : ''}`}
                        >
                            {plan.tag && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-4 py-1 rounded-full text-xs shadow-lg">
                                    {plan.tag}
                                </div>
                            )}

                            {buttonState.variant === 'current' && (
                                <div className="absolute -top-3 right-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold px-3 py-1 rounded-full text-xs shadow-lg flex items-center gap-1">
                                    <CheckCircle2Icon className="w-3 h-3" />
                                    Ativo
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-foreground">{formatPrice(price)}</span>
                                        <span className="text-base text-muted-foreground">/mês</span>
                                    </div>
                                    {billingPeriod === 'yearly' && (
                                        <div className="mt-2 space-y-1">
                                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                                                💰 Economize {formatPrice(savings)}/ano
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Total: {formatPrice(totalYearly)}/ano
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-2.5">
                                            <CheckCircle2Icon className="w-5 h-5 text-primary flex-shrink-0" />
                                            <span className="text-sm text-foreground/90 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleStartTrial(plan.name)}
                                        disabled={startingTrial !== null || buttonState.disabled}
                                        className={`w-full py-4 rounded-xl font-bold text-base transition-all transform disabled:opacity-50 disabled:cursor-not-allowed ${buttonState.variant === 'current'
                                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/50 cursor-not-allowed'
                                                : buttonState.variant === 'upgrade'
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:scale-105'
                                                    : buttonState.variant === 'downgrade'
                                                        ? 'bg-muted text-muted-foreground border-2 border-border cursor-not-allowed'
                                                        : plan.ctaStyle === 'solid'
                                                            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:scale-105'
                                                            : 'border-2 border-primary text-primary hover:bg-primary/10 hover:scale-105'
                                            }`}
                                    >
                                        {startingTrial === plan.name ? 'Processando...' : buttonState.text}
                                    </button>
                                    <p className="text-xs text-center text-muted-foreground">
                                        🔒 Seguro • ✅ Garantia 7 dias • ⚡ Ativação instantânea
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Comparativo */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="max-w-4xl mx-auto"
            >
                <h3 className="text-2xl font-bold text-center mb-6">Compare os Planos</h3>
                <div className="overflow-x-auto rounded-xl border border-border backdrop-blur-sm">
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Recurso</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground">FREE</th>
                                <th className={`px-4 py-3 text-center text-sm font-semibold ${isPro ? 'text-emerald-500' : 'text-primary'}`}>
                                    PRO {isPro && '✓'}
                                </th>
                                <th className={`px-4 py-3 text-center text-sm font-semibold ${isPremium ? 'text-emerald-500' : 'text-primary'}`}>
                                    PREMIUM {isPremium && '✓'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {comparisonData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 text-sm text-foreground">{row.feature}</td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">{row.free}</td>
                                    <td className={`px-4 py-3 text-center text-sm font-semibold ${isPro ? 'text-emerald-500' : 'text-foreground'}`}>{row.pro}</td>
                                    <td className={`px-4 py-3 text-center text-sm font-bold ${isPremium ? 'text-emerald-500' : 'text-primary'}`}>{row.premium}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Depoimentos */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="max-w-5xl mx-auto"
            >
                <h3 className="text-2xl font-bold text-center mb-6">
                    O que dizem nossos <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">estudantes</span>
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                    {[
                        { text: "A correção de redação IA é incrível! Me ajudou muito a melhorar.", author: "Maria S.", role: "Concurseira - TRF" },
                        { text: "O sistema de ciclos mudou completamente minha forma de estudar.", author: "João P.", role: "Aprovado - PRF" },
                        { text: "Vale cada centavo! Recursos essenciais para quem estuda sério.", author: "Ana L.", role: "Estudante - PF" }
                    ].map((review, idx) => (
                        <motion.div
                            key={idx}
                            className="p-4 rounded-xl bg-muted/20 border border-border backdrop-blur-sm hover:bg-muted/30 transition-colors"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <StarIcon key={i} className="w-4 h-4 text-primary fill-primary" />
                                ))}
                            </div>
                            <p className="text-sm text-foreground/90 mb-2 italic">"{review.text}"</p>
                            <div>
                                <p className="text-sm font-semibold text-foreground">— {review.author}</p>
                                <p className="text-xs text-muted-foreground">{review.role}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* FAQ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="max-w-3xl mx-auto"
            >
                <h3 className="text-2xl font-bold text-center mb-6">Perguntas Frequentes</h3>
                <div className="space-y-3">
                    {faqData.map((faq, index) => {
                        const isOpen = openFAQIndex === index;
                        return (
                            <div key={index} className="rounded-xl border border-border bg-muted/10 overflow-hidden backdrop-blur-sm">
                                <button
                                    onClick={() => setOpenFAQIndex(isOpen ? null : index)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
                                >
                                    <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                        <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="px-6 pb-4">
                                                <p className="text-sm text-muted-foreground">{faq.answer}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* CTA Final */}
            {!isPremium && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="max-w-3xl mx-auto text-center p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30 backdrop-blur-sm"
                >
                    <h3 className="text-3xl font-bold mb-3">
                        Pronto para <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">transformar seus estudos</span>?
                    </h3>
                    <p className="text-muted-foreground mb-6">Comece agora e veja a diferença. Garantia de 7 dias ou seu dinheiro de volta!</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => document.querySelector('[data-plan="Premium"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                            className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:opacity-90 shadow-lg transform hover:scale-105 transition-all"
                        >
                            Começar Premium
                        </button>
                        {!isPro && (
                            <button
                                onClick={() => document.querySelector('[data-plan="Pro"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                className="px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/10 transform hover:scale-105 transition-all"
                            >
                                Ver Plano Pro
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        🔒 Pagamento Seguro • ✅ Garantia de 7 Dias CDC • ⚡ Ativação Instantânea
                    </p>
                </motion.div>
            )}

            {/* Sticky CTA Mobile */}
            {!isPremium && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border z-50">
                    <button
                        onClick={() => document.querySelector('[data-plan="Premium"]')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg"
                    >
                        {isPro ? 'Upgrade para Premium' : 'Começar Agora'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentPageStripe;
