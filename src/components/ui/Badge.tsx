import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'primary', children, className = '' }: BadgeProps) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  const variants = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
  };

  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>;
}