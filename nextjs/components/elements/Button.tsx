import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover:transform hover:-translate-y-0.5';
  
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'bg-blue-100 text-gray-800 hover:bg-blue-200',
    accent: 'bg-orange-400 text-gray-900 hover:bg-orange-500 font-semibold',
    outline: 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

