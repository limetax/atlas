import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'info' | 'neutral' | 'active';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium';
  
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-800',
  };
  
  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

