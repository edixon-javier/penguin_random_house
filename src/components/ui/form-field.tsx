import React from 'react';
import { Label } from './label';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  as?: 'input' | 'textarea' | 'select';
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label, 
    error, 
    className, 
    labelClassName, 
    inputClassName, 
    errorClassName,
    as = 'input',
    id,
    children,
    ...props 
  }, ref) => {
    const inputId = id || `field-${props.name}`;
    
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label 
            htmlFor={inputId} 
            className={cn("text-sm font-medium", labelClassName)}
          >
            {label}
          </Label>
        )}
        
        {as === 'textarea' ? (
          <textarea
            id={inputId}
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              inputClassName
            )} 
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
        ) : as === 'select' ? (
          <select
            id={inputId}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              inputClassName
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          >
            {children}
          </select>
        ) : (
          <Input 
            id={inputId}
            className={cn(inputClassName)} 
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            ref={ref}
            {...props} 
          />
        )}
        {error && (
          <p 
            id={`${inputId}-error`}
            className={cn("text-sm text-red-500", errorClassName)}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
