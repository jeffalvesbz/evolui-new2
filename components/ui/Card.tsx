import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
<<<<<<< HEAD
  <div className={`bg-card/60 backdrop-blur-xl border border-border rounded-xl text-card-foreground shadow-sm ${className || ''}`}>
=======
  <div className={`bg-card/60 backdrop-blur-xl border border-white/10 rounded-xl text-card-foreground shadow-sm ${className || ''}`}>
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    {children}
  </div>
);

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-6 ${className || ''}`}>
    {children}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-6 pt-0 ${className || ''}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}>
    {children}
  </h3>
);
