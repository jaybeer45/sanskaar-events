// src/components/ui/OTP/OTP.jsx
import { useRef } from 'react';

const OTP_LENGTH = 6;

const OTP = ({ value = '', onChange, error, disabled }) => {
  const inputsRef = useRef([]);

  const digits = value.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);

  const updateValue = (newDigits) => {
    onChange?.(newDigits.join(''));
  };

  const handleChange = (index, rawValue) => {
    const digit = rawValue.replace(/[^0-9]/g, '').slice(-1); // sirf last digit rakho
    const newDigits = [...digits];
    newDigits[index] = digit;
    updateValue(newDigits);

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    const newDigits = pasted.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);
    updateValue(newDigits);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  return (
    <div>
      <div className="flex gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`
              h-12 w-11 rounded-lg border text-center text-lg font-semibold
              bg-gray-100 focus:bg-white
              transition-colors duration-150
              focus:outline-none focus:ring-2
              disabled:cursor-not-allowed disabled:opacity-60
              ${
                error
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-gray-200 focus:ring-red-100 focus:border-brand-red'
              }
            `}
          />
        ))}
      </div>
      {error && <p role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default OTP;