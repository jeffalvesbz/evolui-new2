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

    const blurClasses = {
        sm: 'blur-[4px]',
        md: 'blur-[8px]',
        lg: 'blur-[12px]',
    };

    const handleUpgrade = () => {
        navigate('/pagamento');
    };

    if (!isLocked) {
        return <>{children}</>;
    }

    return (
        <div className="relative rounded-xl overflow-hidden">
            {/* Badge de Plano Requerido */}
            <div className="absolute top-3 right-3 z-20">
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 ${requiredPlan === 'premium'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    }`}>
                    <SparklesIcon className="w-3 h-3" />
                    {requiredPlan === 'premium' ? 'PREMIUM' : 'PRO'}
                </div>
            </div>

            {/* Conteúdo com Blur */}
            {showPreview && (
                <div className={`${blurClasses[blurAmount]} pointer-events-none select-none`}>
                    {children}
                </div>
            )}

            {/* Overlay com Botão de Upgrade */}
            <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-6 transition-colors duration-300">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4 max-w-md"
                >
                    <div className="flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <LockIcon className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {feature}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {requiredPlan === 'premium'
                                ? 'Este recurso está disponível apenas no plano Premium'
                                : 'Este recurso está disponível nos planos Pro e Premium'
                            }
                        </p>
                    </div>

                    <button
                        onClick={handleUpgrade}
                        className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-105 ${requiredPlan === 'premium'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                            }`}
                    >
                        Fazer Upgrade para {requiredPlan === 'premium' ? 'Premium' : 'Pro'}
                    </button>

                    {planType === 'free' && (
                        <p className="text-xs text-muted-foreground">
                            Experimente grátis por 3 dias
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default PremiumFeatureWrapper;
