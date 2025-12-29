import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2Icon, XCircleIcon, SparklesIcon, ZapIcon, CrownIcon } from './icons';

const PlanCard = ({
    title,
    price,
    features,
    recommended = false,
    onSelect,
    delay = 0
}: {
    title: string,
    price: string,
    features: { text: string, included: boolean }[],
    recommended?: boolean,
    onSelect: () => void,
    delay?: number
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className={`relative p-8 rounded-2xl border flex flex-col h-full ${recommended
                ? 'bg-white/5 border-primary/50 shadow-2xl shadow-primary/10'
                : 'bg-black/20 border-white/10 hover:border-white/20'
            } transition-all duration-300`}
    >
        {recommended && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <SparklesIcon className="w-3 h-3" />
                MAIS POPULAR
            </div>
        )}

        <div className="mb-6">
            <h3 className={`text-xl font-bold mb-2 ${recommended ? 'text-white' : 'text-muted-foreground'}`}>{title}</h3>
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold text-white">{price}</span>
                <span className="text-muted-foreground text-sm">/mês</span>
            </div>
        </div>

        <ul className="space-y-4 mb-8 flex-1">
            {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                    {feature.included ? (
                        <CheckCircle2Icon className={`w-5 h-5 shrink-0 ${recommended ? 'text-primary' : 'text-green-500/70'}`} />
                    ) : (
                        <XCircleIcon className="w-5 h-5 shrink-0 text-muted-foreground/30" />
                    )}
                    <span className={feature.included ? 'text-gray-300' : 'text-muted-foreground/50'}>
                        {feature.text}
                    </span>
                </li>
            ))}
        </ul>

        <button
            onClick={onSelect}
            className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${recommended
                    ? 'bg-primary hover:bg-primary-dark text-white hover:scale-105 shadow-lg shadow-primary/20'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
        >
            {recommended ? 'Começar Agora' : 'Escolher Plano'}
        </button>
    </motion.div>
);

export const PricingSection = () => {

    const handleScrollToSignup = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section className="py-24 px-6 relative" id="precos">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                        Invista na sua aprovação
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Comece grátis e evolua conforme sua necessidade. Cancele quando quiser.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {/* FREE */}
                    <PlanCard
                        title="Free"
                        price="R$ 0"
                        delay={0}
                        onSelect={handleScrollToSignup}
                        features={[
                            { text: "1 Cronograma de Edital", included: true },
                            { text: "50 Flashcards manuais/mês", included: true },
                            { text: "5 Questões com IA por dia", included: true },
                            { text: "Dashboard Básico", included: true },
                            { text: "Correção de Redação", included: false },
                            { text: "Planejamento Automático com IA", included: false },
                        ]}
                    />

                    {/* PRO */}
                    <PlanCard
                        title="Pro"
                        price="R$ 29,90"
                        recommended={true}
                        delay={0.1}
                        onSelect={handleScrollToSignup}
                        features={[
                            { text: "3 Cronogramas de Edital", included: true },
                            { text: "500 Flashcards/mês", included: true },
                            { text: "30 Questões com IA por dia", included: true },
                            { text: "Dashboard Completo", included: true },
                            { text: "5 Correções de Redação/mês", included: true },
                            { text: "Planejamento Automático com IA", included: false },
                        ]}
                    />

                    {/* PREMIUM */}
                    <PlanCard
                        title="Premium"
                        price="R$ 49,90"
                        delay={0.2}
                        onSelect={handleScrollToSignup}
                        features={[
                            { text: "Editais Ilimitados", included: true },
                            { text: "2.000 Flashcards/mês", included: true },
                            { text: "100 Questões com IA por dia", included: true },
                            { text: "Dashboard Completo + Insights", included: true },
                            { text: "15 Correções de Redação/mês", included: true },
                            { text: "Planejamento Automático com IA", included: true },
                        ]}
                    />
                </div>
            </div>
        </section>
    );
};
