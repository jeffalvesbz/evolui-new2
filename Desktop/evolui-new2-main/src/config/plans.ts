export interface Plan {
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

export const plans: Plan[] = [
    {
        name: 'Pro',
        monthlyPrice: 20.93,
        yearlyPrice: 251.16,
        features: [
            '3 Editais e Planos',
            '10 Correções IA/mês',
            '30 Questões IA/dia',
            '500 Flashcards/mês',
            'Estatísticas Avançadas'
        ],
        cta: 'Testar Grátis',
        ctaStyle: 'outline',
        color: 'bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 border-primary/40',
    },
    {
        name: 'Premium',
        monthlyPrice: 34.93,
        yearlyPrice: 419.16,
        features: [
            'Tudo Ilimitado',
            '100 Questões IA/dia',
            '2000 Flashcards/mês',
            'OCR de Redação Manuscrita',
            'Suporte Prioritário 24/7'
        ],
        cta: 'Começar Agora',
        ctaStyle: 'solid',
        tag: 'Mais Popular',
        color: 'bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-primary/30 dark:to-secondary/30 border-primary/50',
        isPremium: true
    }
];
