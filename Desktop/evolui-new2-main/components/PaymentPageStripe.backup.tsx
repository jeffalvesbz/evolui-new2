import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2Icon, ChevronDownIcon, TrophyIcon, StarIcon, LockIcon, ZapIcon } from './icons';
import { toast } from './Sonner';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../services/stripeService';
import { supabase } from '../services/supabaseClient';

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
    isPremium?: boolean;
}

interface FAQItem {
    question: string;
    answer: string;
}

const plans: Plan[] = [
    {
        name: 'Pro',
        monthlyPrice: 29.00,
        yearlyPrice: 251.16, // 30% de desconto (R$ 29.00 * 12 * 0.7)
        features: [
            '3 Editais e Planos de Estudo',
            '3 Ciclos de Estudos Adaptativos',
            '10 Correções de Redação IA/mês',
            'Flashcards com IA - 25 por dia',
            'Estatísticas Detalhadas de Progresso',
            'Sistema de Revisão Inteligente (SRS)'
        ],
        cta: 'Começar Teste Grátis',
        ctaStyle: 'outline',
        color: 'bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 dark:from-primary/20 dark:via-primary/10 dark:to-secondary/20 border-primary/40 dark:border-primary/50',
    },
    {
        name: 'Premium',
        monthlyPrice: 49.90,
        yearlyPrice: 419.16, // 30% de desconto (R$ 49.90 * 12 * 0.7)
        features: [
            '✅ Tudo do Pro + Recursos Ilimitados',
            '✅ Correções de Redação IA - 30/mês',
            '✅ Flashcards com IA - 50 por dia',
            '✅ Envie foto da sua redação escrita à mão',
            '✅ Suporte Prioritário 24/7',
            '✅ Gráficos Avançados de Desempenho'
        ],
        cta: 'Começar Premium Agora',
        ctaStyle: 'solid',
        tag: 'Mais Popular',
        color: 'bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/20 dark:from-primary/30 dark:via-secondary/15 dark:to-primary/30 border-primary/50 dark:border-primary/70',
        isPremium: true
    }
];

const faqData: FAQItem[] = [
    {
        question: 'Como funciona o período de teste de 3 dias?',
        answer: 'Você tem 3 dias completos para testar todos os recursos do plano escolhido. É necessário informar um cartão de crédito para iniciar o teste, mas você não será cobrado durante esses 3 dias. Após o período de teste, a assinatura será ativada automaticamente, mas você pode cancelar a qualquer momento antes do término do teste sem nenhuma cobrança.'
    },
    {
        question: 'Preciso informar cartão de crédito para começar o teste?',
        answer: 'Sim, é necessário informar um cartão de crédito para iniciar o teste gratuito. No entanto, você não será cobrado durante os 3 dias de teste. Se cancelar antes do término do período de teste, nenhuma cobrança será feita. Seu cartão só será cobrado após os 3 dias, caso você decida continuar com a assinatura.'
    },
    {
        question: 'O que acontece após os 3 dias de teste?',
        answer: 'Após 3 dias, sua conta bloqueia os recursos pagos automaticamente. Nenhuma cobrança será feita. Você só será cobrado se decidir ativar a assinatura manualmente.'
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
    },
    {
        question: 'Qual a diferença entre os planos Pro e Premium?',
        answer: 'O plano Pro oferece recursos essenciais com limites (3 editais, 3 ciclos, 10 correções IA/mês, 25 flashcards/dia). O Premium oferece limites maiores (30 correções IA/mês, 50 flashcards/dia) e recursos exclusivos como envio de foto de redação escrita à mão para correção automática e suporte prioritário.'
    },
    {
        question: 'O desconto de 30% no plano anual é permanente?',
        answer: 'Sim! O desconto de 30% é aplicado automaticamente quando você escolhe o plano anual. Você economiza significativamente pagando antecipadamente por 12 meses.'
    }
];

const PaymentPageStripe: React.FC = () => {
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
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
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 dark:border-primary/50 rounded-full text-primary dark:text-primary/90 text-sm font-bold shadow-lg shadow-primary/20"
                >
                    <TrophyIcon className="w-4 h-4" />
                    <span>3 Dias Grátis</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-bold text-foreground"
                >
                    Evolua com o <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Premium</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium"
                >
                    Teste grátis por 3 dias • Cancele quando quiser
                </motion.p>

                {/* Badges de Confiança */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-wrap items-center justify-center gap-4 pt-2"
                >
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                        <LockIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Pagamento 100% Seguro</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full">
                        <CheckCircle2Icon className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-primary">Cartão de Crédito Aceito</span>
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
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-4 pt-4"
                >
                    <span className={`text-sm font-semibold transition-colors ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Mensal
                    </span>
                    <button
                        onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                        className={`relative h-9 w-16 rounded-full p-1 transition-all duration-300 ${billingPeriod === 'yearly'
                                ? 'bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/30'
                                : 'bg-zinc-700 dark:bg-zinc-600'
                            }`}
                    >
                        <motion.div
                            layout
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`h-7 w-7 rounded-full bg-white shadow-lg ${billingPeriod === 'yearly' ? 'ml-auto' : ''}`}
                        />
                    </button>
                    <span className={`text-sm font-semibold transition-colors ${billingPeriod === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Anual <span className="text-emerald-500 dark:text-emerald-400 font-bold">-30%</span>
                    </span>
                </motion.div>
            </div>

            {/* Benefícios Principais */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="max-w-5xl mx-auto"
            >
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                        <ZapIcon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-foreground mb-1">Acelere Seus Estudos</h4>
                            <p className="text-xs text-muted-foreground">IA que adapta seu plano de estudos ao seu ritmo</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                        <TrophyIcon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-foreground mb-1">Aumente Suas Notas</h4>
                            <p className="text-xs text-muted-foreground">Correções de redação instantâneas e detalhadas</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                        <StarIcon className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-foreground mb-1">Acompanhe Seu Progresso</h4>
                            <p className="text-xs text-muted-foreground">Estatísticas detalhadas e relatórios de desempenho</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Comparação de Valor */}
            {billingPeriod === 'yearly' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl mx-auto p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-2 border-emerald-500/30 rounded-xl"
                >
                    <div className="flex items-center justify-center gap-2 text-center">
                        <ZapIcon className="w-5 h-5 text-emerald-500" />
                        <p className="text-sm font-bold text-foreground">
                            <span className="text-emerald-500">Economia de 30%</span> no plano anual • 
                            <span className="text-blue-500"> Economize até R$ 179,64/ano</span>
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Cards dos Planos */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {plans.map((plan, index) => {
                    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice / 12;
                    const savings = billingPeriod === 'yearly' ? (plan.monthlyPrice * 12 - plan.yearlyPrice) : 0;
                    const monthlyCost = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice / 12;

                    return (
                        <motion.div
                            key={plan.name}
                            data-plan={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative rounded-2xl border-2 p-6 ${plan.color} backdrop-blur-sm ${plan.isPremium
                                    ? 'ring-2 ring-primary/50 dark:ring-primary/70 shadow-2xl shadow-primary/20 scale-105 z-10'
                                    : 'shadow-lg'
                                } hover:shadow-xl transition-all duration-300`}
                        >
                            {plan.tag && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-4 py-1 rounded-full text-xs shadow-lg animate-pulse">
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
                                    {billingPeriod === 'yearly' && savings > 0 && (
                                        <div className="mt-2 space-y-1">
                                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                                                💰 Economize {formatPrice(savings)}/ano
                                            </p>
                                            <p className="text-xs text-muted-foreground line-through">
                                                De {formatPrice(plan.monthlyPrice)}/mês
                                            </p>
                                        </div>
                                    )}
                                    {billingPeriod === 'monthly' && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Apenas {formatPrice(monthlyCost * 0.07)} por dia
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2.5 pt-2">
                                    {plan.features.map((feature, idx) => (
                                        <motion.div
                                            key={feature}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + index * 0.1 + idx * 0.05 }}
                                            className="flex items-start gap-2.5"
                                        >
                                            <CheckCircle2Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.isPremium
                                                    ? 'text-primary'
                                                    : 'text-primary'
                                                }`} />
                                            <span className="text-sm text-foreground/90 font-medium leading-relaxed">{feature}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="pt-2 space-y-2">
                                    <button
                                        onClick={() => handleStartTrial(plan.name)}
                                        disabled={startingTrial !== null}
                                        className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-200 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${plan.ctaStyle === 'solid'
                                                ? 'bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/30'
                                                : 'border-2 border-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/20 hover:border-primary/80'
                                            }`}
                                    >
                                        {startingTrial === plan.name ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                                                />
                                                Processando...
                                            </span>
                                        ) : (
                                            plan.cta
                                        )}
                                    </button>
                                    <div className="text-center space-y-1">
                                        <p className="text-xs text-muted-foreground">
                                            🔒 Pagamento seguro • 3 dias grátis
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Cancele quando quiser • Sem compromisso
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Garantia e Segurança */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4"
            >
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-zinc-50/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
                    <LockIcon className="w-8 h-8 text-primary mb-2" />
                    <h4 className="font-bold text-foreground mb-1">Pagamento Seguro</h4>
                    <p className="text-xs text-muted-foreground">Criptografia SSL e processamento seguro</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-zinc-50/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
                    <TrophyIcon className="w-8 h-8 text-primary mb-2" />
                    <h4 className="font-bold text-foreground mb-1">Garantia Total</h4>
                    <p className="text-xs text-muted-foreground">Cancele a qualquer momento, sem perguntas</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-zinc-50/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
                    <StarIcon className="w-8 h-8 text-blue-500 mb-2" />
                    <h4 className="font-bold text-foreground mb-1">Suporte Dedicado</h4>
                    <p className="text-xs text-muted-foreground">Equipe pronta para ajudar você</p>
                </div>
            </motion.div>

            {/* Prova Social */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="max-w-5xl mx-auto"
            >
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                        Junte-se a <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">milhares de aprovados</span>
                    </h3>
                    <p className="text-muted-foreground">Estudantes que já transformaram seus estudos com o Evolui</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <StarIcon key={i} className="w-4 h-4 text-primary fill-primary" />
                            ))}
                        </div>
                        <p className="text-sm text-foreground/90 mb-2 italic">
                            "A correção de redação IA é incrível! Me ajudou a melhorar muito minhas notas."
                        </p>
                        <p className="text-xs text-muted-foreground font-semibold">— Maria S., Aprovada</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <StarIcon key={i} className="w-4 h-4 text-primary fill-primary" />
                            ))}
                        </div>
                        <p className="text-sm text-foreground/90 mb-2 italic">
                            "O sistema de ciclos adaptativos mudou completamente minha forma de estudar."
                        </p>
                        <p className="text-xs text-muted-foreground font-semibold">— João P., Estudante</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <StarIcon key={i} className="w-4 h-4 text-primary fill-primary" />
                            ))}
                        </div>
                        <p className="text-sm text-foreground/90 mb-2 italic">
                            "Vale cada centavo! Os recursos ilimitados do Premium são essenciais."
                        </p>
                        <p className="text-xs text-muted-foreground font-semibold">— Ana L., Premium</p>
                    </div>
                </div>
            </motion.div>

            {/* Seção FAQ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="max-w-4xl mx-auto"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                        Perguntas <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Frequentes</span>
                    </h2>
                    <p className="text-muted-foreground text-base">
                        Tire suas dúvidas sobre o teste gratuito e assinaturas
                    </p>
                </div>

                <div className="space-y-3">
                    {faqData.map((faq, index) => {
                        const isOpen = openFAQIndex === index;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.05 }}
                                className="rounded-xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5 backdrop-blur-sm overflow-hidden hover:border-primary/30 dark:hover:border-primary/50 transition-colors"
                            >
                                <button
                                    onClick={() => setOpenFAQIndex(isOpen ? null : index)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-100/50 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <span className="font-semibold text-foreground pr-4 group-hover:text-primary transition-colors">
                                        {faq.question}
                                    </span>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-shrink-0"
                                    >
                                        <ChevronDownIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
            </motion.div>

            {/* CTA Final */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="max-w-3xl mx-auto text-center p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 border-2 border-primary/30 dark:border-primary/50"
            >
                <h3 className="text-3xl font-bold text-foreground mb-3">
                    Pronto para <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">transformar seus estudos</span>?
                </h3>
                <p className="text-muted-foreground mb-6 text-lg">
                    Comece seu teste grátis agora e veja a diferença em apenas 3 dias
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => {
                            const premiumCard = document.querySelector('[data-plan="Premium"]');
                            premiumCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/30 transform hover:scale-105 transition-all"
                    >
                        Começar Teste Premium
                    </button>
                    <button
                        onClick={() => {
                            const proCard = document.querySelector('[data-plan="Pro"]');
                            proCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/10 dark:hover:bg-primary/20 transform hover:scale-105 transition-all"
                    >
                        Ver Plano Pro
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                    🔒 Pagamento seguro • ✅ Cancele quando quiser • ⚡ Ativação instantânea
                </p>
            </motion.div>
        </div>
    );
};

export default PaymentPageStripe;
