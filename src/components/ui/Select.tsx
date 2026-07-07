import React, { useId } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    const defaultId = useId();
    const selectId = props.id || defaultId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-text-secondary tracking-wide cursor-pointer select-none">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full bg-card border border-input-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 ${
            error ? 'border-danger/80 focus:border-danger focus:ring-danger' : ''
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-background text-text">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-danger mt-0.5">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';