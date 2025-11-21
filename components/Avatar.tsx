import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getInitials = (name: string): string => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

const COLORS = [
  '#22d3ee', // cyan-400
  '#f97316', // orange-500
  '#16a34a', // green-600
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#ec4899', // pink-500
];

const getColorForName = (name: string): string => {
  if (!name) return COLORS[0];
  const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[charCodeSum % COLORS.length];
};

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className = '' }) => {
  const initials = getInitials(name);
  const color = getColorForName(name);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
  }[size];

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-black flex-shrink-0 ${sizeClasses} ${className}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
