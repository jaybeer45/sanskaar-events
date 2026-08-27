// src/components/ui/Input/Input.jsx
import { forwardRef, useState } from 'react';
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
      ...rest // sab baaki props (onChange, placeholder, value, etc.) yaha aayenge
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-brand-red"> *</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            aria-invalid={error ? 'true' : 'false'}
            className={`
              h-12 w-full rounded-lg border px-4 text-[15px]
              bg-gray-100 focus:bg-white
              transition-colors duration-150
              focus:outline-none focus:ring-2
              disabled:cursor-not-allowed disabled:opacity-60
              ${isPassword ? 'pr-12' : ''}
              ${
                error
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-gray-200 focus:ring-red-100 focus:border-brand-red'
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error ? (
          <p role="alert" className="mt-1.5 text-sm text-red-600">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;