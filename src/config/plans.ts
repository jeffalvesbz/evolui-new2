export interface Plan {
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    cta: string;
    ctaStyle: 'outline' | 'solid';
    tag?: string;
    color: string;
    isPro?: boolean;
    isPremium?: boolean;
}

export const plans: Plan[] = [
    {
        name: 'Pro',
        monthlyPrice: 29.90,
        yearlyPrice: 251.16,
        features: [
            '3 Editais e Planos',
            '5 Correções IA/mês',
            '30 Questões IA/dia',
            '500 Flashcards/mês',
            '📚 Decks Flashcards Prontos',
            'Estatísticas Avançadas'
        ],
        cta: 'Começar Agora',
        ctaStyle: 'solid',
        tag: 'Mais Popular',
        color: 'bg-gradient-to-br from-primary/15 to-secondary/15 dark:from-primary/25 dark:to-secondary/25 border-primary/50',
        isPro: true
    },
    {
        name: 'Premium',
        monthlyPrice: 49.90,
        yearlyPrice: 419.16,
        features: [
            'Editais e Ciclos ILIMITADOS',
            '15 Correções IA/mês',
            '100 Questões IA/dia',
            '2000 Flashcards/mês',
            '✨ Planejamento Semanal com IA',
            'OCR de Redação Manuscrita',
            'Suporte Prioritário 24/7'
        ],
        cta: 'Fazer Upgrade',
        ctaStyle: 'outline',
        tag: 'Completo',
        color: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border-amber-500/40',
        isPremium: true
    }
];
