import { loadStripe, Stripe } from '@stripe/stripe-js';

// Singleton do Stripe
let stripePromise: Promise<Stripe | null>;

/**
 * Obtém a instância do Stripe (carrega apenas uma vez)
 */
export const getStripe = (): Promise<Stripe | null> => {
    if (!stripePromise) {
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
            console.error('VITE_STRIPE_PUBLISHABLE_KEY não está configurada');
            return Promise.resolve(null);
        }

        stripePromise = loadStripe(publishableKey);
    }

    return stripePromise;
};

/**
 * Tipos de planos disponíveis
 */
export type PlanType = 'pro' | 'premium';
export type BillingPeriod = 'monthly' | 'yearly';

/**
 * Mapeamento de Price IDs
 */
const PRICE_IDS = {
    pro_monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
    pro_yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY,
    premium_monthly: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_MONTHLY,
    premium_yearly: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_YEARLY,
} as const;

/**
 * Obtém o Price ID baseado no plano e período
 */
export const getPriceId = (planType: PlanType, billingPeriod: BillingPeriod): string => {
    const key = `${planType}_${billingPeriod}` as keyof typeof PRICE_IDS;
    const priceId = PRICE_IDS[key];

    if (!priceId) {
        throw new Error(`Price ID não configurado para ${planType} ${billingPeriod}`);
    }

    return priceId;
};

/**
 * Cria uma sessão de checkout do Stripe
 */
export const createCheckoutSession = async (
    planType: PlanType,
    billingPeriod: BillingPeriod,
    userId: string
): Promise<void> => {
    try {
        const priceId = getPriceId(planType, billingPeriod);

        // Chamar a API do Supabase Edge Function para criar a sessão
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                priceId,
                userId,
                planType,
                billingPeriod,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar sessão de checkout');
        }

        const { url } = await response.json();

        // Redirecionar para a URL da sessão de checkout
        if (!url) {
            throw new Error('URL de checkout não foi retornada');
        }

        window.location.href = url;
    } catch (error) {
        console.error('Erro ao criar checkout:', error);
        throw error;
    }
};

/**
 * Cria uma sessão do Customer Portal (para gerenciar assinatura)
 */
export const createPortalSession = async (): Promise<void> => {
    try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro detalhado do portal:', errorData);
            throw new Error(errorData.error || errorData.message || 'Erro ao criar sessão do portal');
        }

        const { url } = await response.json();

        // Redirecionar para o Customer Portal
        window.location.href = url;
    } catch (error) {
        console.error('Erro ao abrir portal:', error);
        throw error;
    }
};

/**
 * Informações dos planos para exibição
 */
export const PLAN_INFO = {
    pro: {
        name: 'PRO',
        monthlyPrice: 29.00,
        yearlyPrice: 240.00,
        features: [
            '3 Editais/Planos de Estudo',
            '3 Ciclos de Estudos',
            'Flashcards Ilimitados',
            '10 Correções de Redação IA/mês',
            'Planejamento Semanal',
            'Estatísticas Avançadas',
            'Exportação de Dados',
            'Sem Anúncios',
        ],
    },
    premium: {
        name: 'PREMIUM',
        monthlyPrice: 49.90,
        yearlyPrice: 396.00,
        features: [
            'Tudo do PRO +',
            'Editais e Ciclos ILIMITADOS',
            'Correções de IA ILIMITADAS',
            'Upload de Redação Manuscrita (OCR)',
            'Análise IA Avançada',
            'Modo Offline',
            'Suporte Prioritário',
            'Acesso Antecipado',
        ],
    },
} as const;

/**
 * Calcula a economia do plano anual
 */
export const calculateYearlySavings = (planType: PlanType): number => {
    const plan = PLAN_INFO[planType];
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = monthlyTotal - plan.yearlyPrice;
    return Math.round(savings);
};

/**
 * Calcula o percentual de desconto do plano anual
 */
export const calculateYearlyDiscount = (planType: PlanType): number => {
    const plan = PLAN_INFO[planType];
    const monthlyTotal = plan.monthlyPrice * 12;
    const discount = ((monthlyTotal - plan.yearlyPrice) / monthlyTotal) * 100;
    return Math.round(discount);
};
