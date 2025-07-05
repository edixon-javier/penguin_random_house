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
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label, 
    error, 
    className, 
    labelClassName, 
    inputClassName, 
    errorClassName,
    id,
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
        <Input 
          id={inputId}
          className={cn(inputClassName)} 
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          ref={ref}
          {...props} 
        />
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
