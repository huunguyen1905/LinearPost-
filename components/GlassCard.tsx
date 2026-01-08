import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-[#1c1c1e]/60 backdrop-blur-xl border border-white/[0.08] shadow-glass rounded-[24px] ${className}`}>
      {children}
    </div>
  );
};