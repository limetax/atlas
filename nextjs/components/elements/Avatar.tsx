import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  fallback = '?',
  className = '',
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };
  
  const baseStyles = 'rounded-full border-2 border-white shadow-sm object-cover flex items-center justify-center bg-lime-500 text-white font-semibold';
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${baseStyles} ${sizes[size]} ${className}`}
      />
    );
  }
  
  return (
    <div className={`${baseStyles} ${sizes[size]} ${className}`}>
      {fallback}
    </div>
  );
};

