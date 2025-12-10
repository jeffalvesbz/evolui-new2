import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'default';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'default' }) => {
  const variantClasses = {
    text: 'skeleton skeleton-text',
    title: 'skeleton skeleton-title',
    avatar: 'skeleton skeleton-avatar',
    card: 'skeleton skeleton-card',
    default: 'skeleton',
  };

  return (
    <div className={`${variantClasses[variant]} ${className || ''}`} />
  );
};
