import React, { useState } from 'react';
import { CreditCardIcon, SparklesIcon, CheckCircle2Icon, FlameIcon, BarChart3Icon, ActivityIcon } from './icons';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { createPortalSession } from '../services/stripeService';
import { toast } from './Sonner';

interface UsageBarProps {
    label: string;
    current: number;
    max: number;
    unit?: string;
    icon?: React.ReactNode;
}

const UsageBar: React.FC<UsageBarProps> = ({ label, current, max, unit = '', icon }) => {
    const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
    const isUnlimited = max === -1;
    const isNearLimit = percentage >= 80 && !isUnlimited;
    const isAtLimit = percentage >= 100 && !isUnlimited;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className={`font-medium ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-foreground'}`}>
                    {current}{unit} / {isUnlimited ? '∞' : `${max}${unit}`}
                </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-gradient-to-r from-primary to-secondary'
                        }`}
                    style={{ width: isUnlimited ? '100%' : `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const SubscriptionSection: React.FC = () => {
    const {
        planType,
        trialEndsAt,
        subscriptionEndsAt,
        stripeCustomerId,
        flashcardsCreatedThisMonth,
        quizQuestionsGeneratedToday,
        hasActiveSubscription,
        isTrialActive,
        getMaxFlashcardsPerMonth,
        getMaxQuizQuestionsPerDay,
        getMaxRedacoesPerMonth,
        getMaxEditais,
        getMaxCiclos,
    } = useSubscriptionStore();

    const [isLoadingPortal, setIsLoadingPortal] = useState(false);

    const handleManageSubscription = async () => {
        setIsLoadingPortal(true);
        try {
            await createPortalSession();
        } catch (error) {
            toast.error('Erro ao abrir portal de assinatura. Tente novamente.');
        } finally {
            setIsLoadingPortal(false);
        }
    };

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const getPlanDisplayName = () => {
        switch (planType) {
            case 'premium': return 'Premium';
            case 'pro': return 'Pro';
            default: return 'Gratuito';
        }
    };

    const getPlanColor = () => {
        switch (planType) {
            case 'premium': return 'from-amber-500 to-orange-500';
            case 'pro': return 'from-primary to-secondary';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const isActive = hasActiveSubscription() || isTrialActive();
    const isTrial = isTrialActive();

    return (
        <section className="bg-card border border-border rounded-xl p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <CreditCardIcon className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Assinatura</h2>
            </div>

            {/* Plan Badge & Status */}
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getPlanColor()} text-white font-bold text-lg shadow-lg`}>
                            {getPlanDisplayName()}
                        </div>
                        {isActive && (
                            <div className="flex items-center gap-1.5 text-emerald-400">
                                <CheckCircle2Icon className="w-5 h-5" />
                                <span className="text-sm font-medium">Ativo</span>
                            </div>
                        )}
                        {isTrial && (
                            <div className="flex items-center gap-1.5 text-amber-400">
                                <SparklesIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Teste Grátis</span>
                            </div>
                        )}
                    </div>

                    {/* Renewal/Trial End Info */}
                    {isTrial && trialEndsAt && (
                        <div className="text-sm text-muted-foreground">
                            <span className="text-amber-400 font-medium">Teste expira em:</span> {formatDate(trialEndsAt)}
                        </div>
                    )}
                    {!isTrial && subscriptionEndsAt && planType !== 'free' && (
                        <div className="text-sm text-muted-foreground">
                            <span className="text-primary font-medium">Renova em:</span> {formatDate(subscriptionEndsAt)}
                        </div>
                    )}
                </div>
            </div>

            {/* Usage Statistics */}
            {planType !== 'free' && isActive && (
                <div className="mb-6 space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Uso do Plano
                    </h3>

                    <UsageBar
                        label="Flashcards IA (mensal)"
                        current={flashcardsCreatedThisMonth}
                        max={getMaxFlashcardsPerMonth()}
                        icon={<ActivityIcon className="w-4 h-4" />}
                    />

                    <UsageBar
                        label="Questões IA (diário)"
                        current={quizQuestionsGeneratedToday}
                        max={getMaxQuizQuestionsPerDay()}
                        icon={<BarChart3Icon className="w-4 h-4" />}
                    />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-muted/20 rounded-lg text-center">
                            <p className="text-2xl font-bold text-foreground">
                                {getMaxEditais() === -1 ? '∞' : getMaxEditais()}
                            </p>
                            <p className="text-xs text-muted-foreground">Editais máx.</p>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-lg text-center">
                            <p className="text-2xl font-bold text-foreground">
                                {getMaxRedacoesPerMonth()}
                            </p>
                            <p className="text-xs text-muted-foreground">Correções IA/mês</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Free Plan CTA */}
            {planType === 'free' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                    <div className="flex items-start gap-3">
                        <FlameIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground mb-1">Você está no plano gratuito</p>
                            <p className="text-sm text-muted-foreground">
                                Faça upgrade para desbloquear flashcards ilimitados, correção de redações com IA e muito mais!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
                {planType !== 'free' && stripeCustomerId ? (
                    <button
                        onClick={handleManageSubscription}
                        disabled={isLoadingPortal}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingPortal ? (
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <CreditCardIcon className="w-5 h-5" />
                        )}
                        {isLoadingPortal ? 'Abrindo...' : 'Gerenciar Assinatura'}
                    </button>
                ) : planType !== 'free' && !stripeCustomerId ? (
                    <div className="w-full p-4 bg-muted/50 rounded-lg border border-muted text-center">
                        <p className="font-medium text-foreground">Assinatura gerenciada manualmente</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Entre em contato com o suporte para alterações: suporte@meueleva.com
                        </p>
                    </div>
                ) : null}

                {(planType === 'free' || planType === 'pro') && (
                    <button
                        onClick={() => window.location.href = '/pagamento'}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-secondary text-black rounded-lg hover:opacity-90 transition-opacity font-semibold shadow-lg shadow-primary/20"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        {planType === 'free' ? 'Fazer Upgrade' : 'Upgrade para Premium'}
                    </button>
                )}

                {stripeCustomerId && (
                    <p className="text-xs text-center text-muted-foreground">
                        Altere seu plano, método de pagamento ou cancele sua assinatura no portal.
                    </p>
                )}
            </div>
        </section>
    );
};

export default SubscriptionSection;
