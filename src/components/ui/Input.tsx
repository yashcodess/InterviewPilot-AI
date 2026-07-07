import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const defaultId = useId();
    const inputId = props.id || defaultId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-text-secondary tracking-wide cursor-pointer select-none">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full bg-card border border-input-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 ${
            error ? 'border-danger/80 focus:border-danger focus:ring-danger' : ''
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-danger mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';