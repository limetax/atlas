import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error = false, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const baseStyles =
      'w-full px-3.5 py-2.5 pr-10 text-sm bg-white border rounded-lg outline-none transition-all duration-150';
    const normalStyles =
      'border-gray-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10';
    const errorStyles = 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10';

    return (
      <div className="relative">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`${baseStyles} ${error ? errorStyles : normalStyles} ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
