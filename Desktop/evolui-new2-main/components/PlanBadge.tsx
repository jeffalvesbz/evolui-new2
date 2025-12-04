import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { SparklesIcon } from './icons';

interface PlanBadgeProps {
  clickable?: boolean;
}

const PlanBadge: React.FC<PlanBadgeProps> = ({ clickable = true }) => {
  const navigate = useNavigate();
  const { planType, trialEndsAt, isTrialActive, hasActiveSubscription } = useSubscriptionStore();

  const getPlanInfo = () => {
    const isTrial = isTrialActive();
    const hasSubscription = hasActiveSubscription();

    if (planType === 'free') {
      return {
        label: 'Free',
        color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
        icon: null,
      };
    }

    if (planType === 'pro') {
      return {
        label: isTrial ? 'Pro (Trial)' : 'Pro',
        color: isTrial 
          ? 'bg-primary/20 text-primary border-primary/30' 
          : 'bg-primary/20 text-primary border-primary/30',
        icon: isTrial ? <SparklesIcon className="w-3 h-3" /> : null,
      };
    }

    if (planType === 'premium') {
      return {
        label: isTrial ? 'Premium (Trial)' : 'Premium',
        color: isTrial
          ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30'
          : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
        icon: <SparklesIcon className="w-3 h-3" />,
      };
    }

    return {
      label: 'Free',
      color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      icon: null,
    };
  };

  const getDaysRemaining = () => {
    if (!trialEndsAt) return null;
    const now = new Date();
    const endsAt = new Date(trialEndsAt);
    const diffTime = endsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const planInfo = getPlanInfo();
  const daysRemaining = isTrialActive() ? getDaysRemaining() : null;
  const isFree = planType === 'free';

  const handleClick = () => {
    if (clickable && (isFree || isTrialActive())) {
      navigate('/pagamento');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${
          clickable && (isFree || isTrialActive()) 
            ? 'cursor-pointer hover:opacity-80 hover:scale-105' 
            : ''
        } ${planInfo.color}`}
        title={clickable && (isFree || isTrialActive()) ? 'Clique para ver planos' : undefined}
      >
        {planInfo.icon}
        <span>{planInfo.label}</span>
      </div>
      {daysRemaining !== null && daysRemaining > 0 && (
        <span className="text-xs text-muted-foreground">
          {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes
        </span>
      )}
    </div>
  );
};

export default PlanBadge;

