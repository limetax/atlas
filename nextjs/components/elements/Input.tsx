import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, className = '', ...props }, ref) => {
  const baseStyles = 'w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150';
  const normalStyles = 'border-gray-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10';
  const errorStyles = 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10';
    
    return (
      <input
        ref={ref}
        className={`${baseStyles} ${error ? errorStyles : normalStyles} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

