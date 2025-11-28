import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Loader2 } from 'lucide-react';
import { createCheckoutSession, PLAN_INFO, calculateYearlyDiscount, type PlanType } from '../services/stripeService';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature?: string;
    requiredPlan?: 'pro' | 'premium';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
    isOpen,
    onClose,
    feature,
    requiredPlan = 'pro',
}) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanType>(requiredPlan);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        try {
            setLoading(true);

            // Obter usuário atual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Você precisa estar logado para fazer upgrade');
                return;
            }

            // Criar sessão de checkout
            await createCheckoutSession(selectedPlan, billingPeriod, user.id);
        } catch (error: any) {
            console.error('Erro ao fazer upgrade:', error);
            toast.error(error.message || 'Erro ao processar pagamento');
            setLoading(false);
        }
    };

    const renderPlanCard = (plan: PlanType) => {
        const info = PLAN_INFO[plan];
        const isSelected = selectedPlan === plan;
        const price = billingPeriod === 'monthly' ? info.monthlyPrice : info.yearlyPrice;
        const pricePerMonth = billingPeriod === 'yearly' ? (info.yearlyPrice / 12).toFixed(2) : info.monthlyPrice.toFixed(2);
        const discount = calculateYearlyDiscount(plan);

        return (
            <motion.div
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                className={`
          relative p-6 rounded-2xl border-2 cursor-pointer transition-all
          ${isSelected
                        ? 'border-primary bg-primary/5 shadow-lg scale-105'
                        : 'border-border hover:border-primary/50 hover:shadow-md'
                    }
        `}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
            >
                {plan === 'premium' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold rounded-full">
                        MAIS POPULAR
                    </div>
                )}

                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{info.name}</h3>
                    {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">R$ {pricePerMonth}</span>
                        <span className="text-muted-foreground">/mês</span>
                    </div>
                    {billingPeriod === 'yearly' && (
                        <p className="text-sm text-muted-foreground mt-1">
                            R$ {price.toFixed(2)} cobrado anualmente
                        </p>
                    )}
                </div>

                <ul className="space-y-3 mb-6">
                    {info.features.map((feat, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{feat}</span>
                        </li>
                    ))}
                </ul>
            </motion.div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-background rounded-2xl p-8 max-w-4xl w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Upgrade para Premium</h2>
                                {feature && (
                                    <p className="text-muted-foreground">
                                        <strong>{feature}</strong> está disponível nos planos pagos
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Toggle de período */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <button
                                onClick={() => setBillingPeriod('monthly')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${billingPeriod === 'monthly'
                                        ? 'bg-primary text-white'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                Mensal
                            </button>
                            <button
                                onClick={() => setBillingPeriod('yearly')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${billingPeriod === 'yearly'
                                        ? 'bg-primary text-white'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                Anual
                                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                    -{calculateYearlyDiscount('pro')}%
                                </span>
                            </button>
                        </div>

                        {/* Cards dos planos */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {renderPlanCard('pro')}
                            {renderPlanCard('premium')}
                        </div>

                        {/* Botões de ação */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleUpgrade}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        Começar Teste Grátis de 3 Dias
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="px-8 border-2 border-border py-4 rounded-xl font-medium hover:bg-muted transition-colors disabled:opacity-50"
                            >
                                Voltar
                            </button>
                        </div>

                        <p className="text-xs text-center text-muted-foreground mt-4">
                            ✨ 3 dias de teste grátis • Sem cartão de crédito • Cancele quando quiser
                        </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
