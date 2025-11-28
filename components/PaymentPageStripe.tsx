import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2Icon, ChevronDownIcon, TrophyIcon, StarIcon, LockIcon, ZapIcon, XIcon } from './icons';
import { toast } from './Sonner';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../services/stripeService';
import { supabase } from '../services/supabaseClient';
import { plans, Plan } from '../src/config/plans';

type BillingPeriod = 'monthly' | 'yearly';

interface FAQItem {
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        question: 'Como funciona o período de teste de 3 dias?',
        answer: 'Você tem 3 dias completos para testar todos os recursos. É necessário informar um cartão, mas você não será cobrado durante o teste. Cancele antes do término sem nenhuma cobrança.'
    },
    {
        question: 'Preciso informar cartão de crédito?',
        answer: 'Sim, para garantir a continuidade após o teste. Porém, você só será cobrado após os 3 dias se não cancelar.'
    },
    {
        question: 'Posso cancelar a qualquer momento?',
        answer: 'Sim! Cancele através das configurações. O cancelamento é efetivado no final do período pago.'
    },
    {
        question: 'Qual a diferença entre Pro e Premium?',
        answer: 'Pro tem limites (3 editais, 10 correções/mês). Premium oferece recursos ilimitados, OCR de redação manuscrita e suporte prioritário.'
    },
    {
        question: 'O desconto de 30% no plano anual é permanente?',
        answer: 'Sim! O desconto é aplicado automaticamente no plano anual.'
    }
];

const comparisonData = [
    { feature: 'Editais e Planos', free: '1', pro: '3', premium: '∞' },
    { feature: 'Ciclos de Estudos', free: '1', pro: '3', premium: '∞' },
    { feature: 'Correções IA/mês', free: '0', pro: '10', premium: '30' },
    { feature: 'Flashcards/mês', free: '50', pro: '500', premium: '2000' },
    { feature: 'OCR Redação', free: '✗', pro: '✗', premium: '✓' },
    { feature: 'Suporte Prioritário', free: '✗', pro: '✗', premium: '✓' },
];

const PaymentPageStripe: React.FC = () => {
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
    const [startingTrial, setStartingTrial] = useState<string | null>(null);
    const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
    const navigate = useNavigate();

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

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-16">
            {/* Header */}
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-full text-primary text-sm font-bold shadow-lg"
                >
                    <TrophyIcon className="w-4 h-4" />
                    <span>3 Dias Grátis</span>
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
                    Teste grátis por 3 dias • Cancele quando quiser
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
                        <StarIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">+10.000 Estudantes</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full">
                        <TrophyIcon className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Garantia de Satisfação</span>
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

                    return (
                        <motion.div
                            key={plan.name}
                            data-plan={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 + index * 0.1 }}
                            className={`relative rounded-2xl border-2 p-6 ${plan.color} ${plan.isPremium ? 'ring-2 ring-primary/60 shadow-2xl shadow-primary/20 scale-105' : 'shadow-lg'
                                } hover:shadow-xl transition-all`}
                        >
                            {plan.tag && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-4 py-1 rounded-full text-xs shadow-lg">
                                    {plan.tag}
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
                                        disabled={startingTrial !== null}
                                        className={`w-full py-4 rounded-xl font-bold text-base transition-all transform hover:scale-105 disabled:opacity-50 ${plan.ctaStyle === 'solid'
                                            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                                            : 'border-2 border-primary text-primary hover:bg-primary/10'
                                            }`}
                                    >
                                        {startingTrial === plan.name ? 'Processando...' : plan.cta}
                                    </button>
                                    <p className="text-xs text-center text-muted-foreground">
                                        🔒 Seguro • 3 dias grátis • Cancele quando quiser
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Tabela Comparativa */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="max-w-4xl mx-auto"
            >
                <h3 className="text-2xl font-bold text-center mb-6">Compare os Planos</h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Recurso</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground">FREE</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-primary">PRO</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-primary">PREMIUM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {comparisonData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 text-sm text-foreground">{row.feature}</td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">{row.free}</td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold text-foreground">{row.pro}</td>
                                    <td className="px-4 py-3 text-center text-sm font-bold text-primary">{row.premium}</td>
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
                        { text: "A correção de redação IA é incrível! Me ajudou muito.", author: "Maria S." },
                        { text: "O sistema de ciclos mudou minha forma de estudar.", author: "João P." },
                        { text: "Vale cada centavo! Recursos essenciais.", author: "Ana L." }
                    ].map((review, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-muted/20 border border-border">
                            <div className="flex gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <StarIcon key={i} className="w-4 h-4 text-primary fill-primary" />
                                ))}
                            </div>
                            <p className="text-sm text-foreground/90 mb-2 italic">"{review.text}"</p>
                            <p className="text-xs text-muted-foreground font-semibold">— {review.author}</p>
                        </div>
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
                            <div key={index} className="rounded-xl border border-border bg-muted/10 overflow-hidden">
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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="max-w-3xl mx-auto text-center p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30"
            >
                <h3 className="text-3xl font-bold mb-3">
                    Pronto para <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">transformar seus estudos</span>?
                </h3>
                <p className="text-muted-foreground mb-6">Comece agora e veja a diferença em 3 dias</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => document.querySelector('[data-plan="Premium"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:opacity-90 shadow-lg transform hover:scale-105 transition-all"
                    >
                        Começar Premium
                    </button>
                    <button
                        onClick={() => document.querySelector('[data-plan="Pro"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        className="px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/10 transform hover:scale-105 transition-all"
                    >
                        Ver Plano Pro
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                    🔒 Seguro • ✅ Cancele quando quiser • ⚡ Ativação instantânea
                </p>
            </motion.div>

            {/* Sticky CTA Mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border z-50">
                <button
                    onClick={() => document.querySelector('[data-plan="Premium"]')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg"
                >
                    Começar Teste Grátis
                </button>
            </div>
        </div>
    );
};

export default PaymentPageStripe;
