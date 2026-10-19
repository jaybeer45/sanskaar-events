// src/components/ui/Input/Input.jsx
import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      type = 'text',
      required,
      className = '',
      id,
      ...rest // everything else (onChange, placeholder, value, ...) goes straight to the input
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id || autoId;
    const messageId = `${inputId}-message`;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
            {label}
            {required && <span className="text-brand-red"> *</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error || helperText ? messageId : undefined}
            className={`
              h-12 w-full rounded-xl border px-4 text-[15px] text-ink placeholder-gray-400
              bg-moonlight focus:bg-white
              transition-colors duration-150
              focus:outline-none focus:ring-2
              disabled:cursor-not-allowed disabled:opacity-60
              ${isPassword ? 'pr-12' : ''}
              ${
                error
                  ? 'border-red-400 focus:ring-red-200'
              : 'border-mist focus:ring-night/20 focus:border-night'
              }
              ${className}
            `}
            {...rest}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-night"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error ? (
          <p id={messageId} role="alert" className="mt-1.5 text-sm text-red-600">
            {error}
          </p>
        ) : helperText ? (
            <p id={messageId} className="mt-1.5 text-sm text-ink/60">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;