import React from 'react';
import { motion } from 'framer-motion';
import { LockIcon, SparklesIcon } from './icons';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useNavigate } from 'react-router-dom';

interface PremiumFeatureWrapperProps {
    isLocked: boolean;
    requiredPlan: 'pro' | 'premium';
    feature: string;
    children: React.ReactNode;
    blurAmount?: 'sm' | 'md' | 'lg';
    showPreview?: boolean;
}

const PremiumFeatureWrapper: React.FC<PremiumFeatureWrapperProps> = ({
    isLocked,
    requiredPlan,
    feature,
    children,
    blurAmount = 'md',
    showPreview = true,
}) => {
    const navigate = useNavigate();
    const { planType } = useSubscriptionStore();

    // Blur base e hover - valores calibrados para reconhecer o gráfico
    const blurConfig = {
        sm: { base: 'blur-[3px]', hover: 'group-hover:blur-[1.5px]' },
        md: { base: 'blur-[4px]', hover: 'group-hover:blur-[2px]' },
        lg: { base: 'blur-[5px]', hover: 'group-hover:blur-[3px]' },
    };

    const handleUpgrade = () => {
        navigate('/pagamento');
    };

    if (!isLocked) {
        return <>{children}</>;
    }

    const isPremium = requiredPlan === 'premium';
    const badgeLabel = isPremium ? 'PREMIUM' : 'PRO';
    const ctaText = 'Ver análise completa';

    return (
        <div className="relative rounded-2xl overflow-hidden group">
            {/* Badge PRO/PREMIUM - Discreto no canto superior direito */}
            <div className="absolute top-3 right-3 z-30">
                <div className={`
                    flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider
                    backdrop-blur-sm
                    ${isPremium
                        ? 'bg-purple-500/15 text-purple-400 dark:text-purple-300 border border-purple-400/20'
                        : 'bg-blue-500/15 text-blue-500 dark:text-blue-300 border border-blue-400/20'
                    }
                `}>
                    <LockIcon className="w-2.5 h-2.5 opacity-70" />
                    <span>{badgeLabel}</span>
                </div>
            </div>

            {/* CONTEÚDO REAL - Sempre visível com blur/opacity */}
            {showPreview && (
                <div className="relative">
                    {/* O children (gráfico/tabela) é renderizado primeiro e sempre visível */}
                    <div
                        className={`
                            ${blurConfig[blurAmount].base}
                            ${blurConfig[blurAmount].hover}
                            pointer-events-none select-none 
                            opacity-[0.55]
                            transition-all duration-500 ease-out
                            group-hover:opacity-[0.70]
                        `}
                        aria-hidden="true"
                    >
                        {children}
                    </div>
                </div>
            )}

            {/* OVERLAY SUTIL - Não compete com o gráfico */}
            <div className={`
                absolute inset-0 z-10 
                flex flex-col items-center justify-start pt-[18%]
                pointer-events-none
                transition-all duration-500 ease-out
                ${/* Light mode: overlay branco translúcido */ ''}
                bg-gradient-to-b from-white/40 via-white/25 to-transparent
                ${/* Dark mode: gradiente muito mais sutil */ ''}
                dark:from-slate-900/30 dark:via-slate-900/15 dark:to-transparent
            `}>
                {/* Círculos decorativos sutis - muito mais discretos */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-30">
                    <div className={`absolute top-1/4 left-1/4 w-24 h-24 rounded-full blur-3xl ${isPremium ? 'bg-purple-400/10' : 'bg-blue-400/10'}`} />
                    <div className={`absolute bottom-1/3 right-1/4 w-20 h-20 rounded-full blur-3xl ${isPremium ? 'bg-pink-400/8' : 'bg-cyan-400/8'}`} />
                </div>

                {/* Container de Texto - Posicionado acima do centro */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative text-center space-y-3 max-w-[260px] px-4 pointer-events-auto"
                >
                    {/* Texto Principal */}
                    <p className="text-sm sm:text-base font-semibold leading-snug text-slate-800 dark:text-white/95 drop-shadow-sm">
                        {feature}
                    </p>

                    {/* Botão CTA - Com glow no hover */}
                    <motion.button
                        onClick={handleUpgrade}
                        className={`
                            relative px-5 py-2 rounded-lg font-semibold text-white text-xs sm:text-sm
                            transition-all duration-300 overflow-hidden
                            ${isPremium
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-md shadow-purple-500/20 group-hover:shadow-lg group-hover:shadow-purple-500/40'
                                : 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/40'
                            }
                            group-hover:scale-[1.03]
                            active:scale-[0.98]
                        `}
                        whileTap={{ scale: 0.97 }}
                    >
                        <span className="relative flex items-center justify-center gap-1.5">
                            <SparklesIcon className="w-3.5 h-3.5" />
                            {ctaText}
                        </span>
                    </motion.button>

                    {/* Trial Text - Simples e visível */}
                    {planType === 'free' && (
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-white drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-none">
                            ✨ Experimente grátis por 3 dias
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default PremiumFeatureWrapper;
