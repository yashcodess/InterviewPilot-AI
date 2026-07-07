import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] hover:scale-[1.02] hover:-translate-y-0.5';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 focus:ring-offset-background border border-primary/30',
    secondary: 'bg-surface hover:bg-border text-text border border-border',
    outline: 'bg-transparent border border-border hover:bg-surface text-text-secondary hover:text-text-bright',
    ghost: 'bg-transparent hover:bg-surface text-text-secondary hover:text-text-bright',
    danger: 'bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 focus:ring-danger',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}