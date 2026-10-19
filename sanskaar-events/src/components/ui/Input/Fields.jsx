// src/components/ui/Input/Fields.jsx
// Select and Textarea that look and behave like the shared Input component
import { forwardRef, useId } from 'react';

const base =
    'w-full rounded-xl border bg-moonlight text-[15px] text-ink placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60';

const tone = (error) =>
    error ? 'border-red-400 focus:ring-red-200' : 'border-mist focus:border-night focus:ring-night/20';

const FieldShell = ({ id, label, required, error, helperText, children }) => (
    <div className="w-full">
        {label && (
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
                {label}
                {required && <span className="text-brand-red"> *</span>}
            </label>
        )}
        {children}
        {error ? (
            <p id={`${id}-message`} role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>
        ) : helperText ? (
            <p id={`${id}-message`} className="mt-1.5 text-sm text-ink/60">{helperText}</p>
        ) : null}
    </div>
);

export const Select = forwardRef(
    ({ label, error, helperText, required, id, className = '', children, ...rest }, ref) => {
        const autoId = useId();
        const fieldId = id || autoId;
        return (
            <FieldShell id={fieldId} label={label} required={required} error={error} helperText={helperText}>
                <select
                    ref={ref}
                    id={fieldId}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error || helperText ? `${fieldId}-message` : undefined}
                    className={`${base} ${tone(error)} h-12 px-4 ${className}`}
                    {...rest}
                >
                    {children}
                </select>
            </FieldShell>
        );
    }
);
Select.displayName = 'Select';

export const Textarea = forwardRef(
    ({ label, error, helperText, required, id, rows = 4, className = '', ...rest }, ref) => {
        const autoId = useId();
        const fieldId = id || autoId;
        return (
            <FieldShell id={fieldId} label={label} required={required} error={error} helperText={helperText}>
                <textarea
                    ref={ref}
                    id={fieldId}
                    rows={rows}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error || helperText ? `${fieldId}-message` : undefined}
                    className={`${base} ${tone(error)} resize-none px-4 py-3 ${className}`}
                    {...rest}
                />
            </FieldShell>
        );
    }
);
Textarea.displayName = 'Textarea';