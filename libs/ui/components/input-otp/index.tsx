import {
  type ClipboardEvent,
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { cn } from '../../helpers/utils';
import type { Size } from '../common';

export type InputOtpProps = {
  /** Number of OTP digits/characters. Default 6. */
  length?: number;
  /** Current value (controlled). Length must equal `length`. */
  value?: string;
  /** Called with the full OTP string on every change. */
  onChange?: (value: string) => void;
  /** Called when all slots are filled. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  /** Mask each character (e.g. for PIN entry). */
  mask?: boolean;
  /** Placeholder character for empty slots. Default "○". */
  placeholder?: string;
  size?: Size;
  color?: 'primary' | 'neutral' | 'error';
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
  /** Whether to auto-focus the first slot on mount. */
  autoFocus?: boolean;
  customClasses?: {
    root?: string;
    slot?: string;
    label?: string;
    error?: string;
  };
};

export type InputOtpRef = {
  focus: () => void;
  clear: () => void;
};

const sizeClasses: Record<Size, { slot: string; font: string; gap: string }> = {
  small: {
    slot: 'w-8 h-9',
    font: 'text-16 font-semibold',
    gap: 'gap-1.5',
  },
  middle: {
    slot: 'w-10 h-11',
    font: 'text-20 font-bold',
    gap: 'gap-2',
  },
  large: {
    slot: 'w-12 h-[52px]',
    font: 'text-24 font-bold',
    gap: 'gap-2.5',
  },
};

const colorClasses = {
  primary: {
    border: 'border-neutral-border',
    focus: 'border-primary shadow-focus-ring',
    filled: 'border-primary-border bg-primary-background',
  },
  neutral: {
    border: 'border-neutral-border',
    focus: 'border-primary shadow-focus-ring',
    filled: 'border-neutral-text-secondary',
  },
  error: {
    border: 'border-error',
    focus: 'border-error shadow-[0_0_0_3px_#fecaca]',
    filled: 'border-error bg-error-bg',
  },
};

export const InputOtp = forwardRef<InputOtpRef, InputOtpProps>(
  (
    {
      length = 6,
      value,
      onChange,
      onComplete,
      disabled = false,
      mask = false,
      placeholder = '○',
      size = 'middle',
      color = 'primary',
      error,
      label,
      required,
      className,
      autoFocus = false,
      customClasses,
    },
    ref,
  ) => {
    const sizeClass = sizeClasses[size];
    const colorClass = error ? colorClasses.error : colorClasses[color];

    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const [internalValue, setInternalValue] = useState(() =>
      (value ?? '').padEnd(length, '').slice(0, length),
    );

    // Sync controlled value
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value.padEnd(length, '').slice(0, length));
      }
    }, [value, length]);

    useImperativeHandle(ref, () => ({
      focus: () => inputsRef.current[0]?.focus(),
      clear: () => {
        const empty = ''.padEnd(length, ' ');
        setInternalValue(empty);
        onChange?.('');
        inputsRef.current[0]?.focus();
      },
    }));

    useEffect(() => {
      if (autoFocus) {
        inputsRef.current[0]?.focus();
      }
    }, [autoFocus]);

    const updateValue = useCallback(
      (newVal: string) => {
        const trimmed = newVal.slice(0, length);
        setInternalValue(trimmed.padEnd(length, ' '));
        const cleaned = trimmed.replace(/ /g, '');
        onChange?.(cleaned);
        if (cleaned.length === length) {
          onComplete?.(cleaned);
        }
      },
      [length, onChange, onComplete],
    );

    const handleInput = (index: number, char: string) => {
      if (disabled) return;
      const chars = internalValue.split('');
      chars[index] = char;
      const next = chars.join('');
      updateValue(next);

      // Move to next slot
      if (char && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
        inputsRef.current[index + 1]?.select();
      }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        const chars = internalValue.split('');
        if (chars[index] && chars[index] !== ' ') {
          chars[index] = ' ';
          updateValue(chars.join(''));
        } else if (index > 0) {
          chars[index - 1] = ' ';
          updateValue(chars.join(''));
          inputsRef.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputsRef.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        inputsRef.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled) return;
      const pasted = e.clipboardData.getData('text').replace(/\s/g, '').slice(0, length);
      if (pasted) {
        updateValue(pasted);
        const focusIndex = Math.min(pasted.length, length - 1);
        inputsRef.current[focusIndex]?.focus();
      }
    };

    return (
      <div className={cn('w-fit', customClasses?.root)}>
        {label && (
          <span className={cn('mb-2 block text-14 font-semibold', customClasses?.label)}>
            {label}
            {required && <span className="ml-0.5 text-error">*</span>}
          </span>
        )}

        <div
          className={cn(
            'flex',
            sizeClass.gap,
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
        >
          {Array.from({ length }, (_, i) => {
            const char = internalValue[i];
            const isFilled = char && char !== ' ';
            const displayChar = isFilled ? (mask ? '•' : char) : '';
            const slotKey = `otp-${length}-${i}`;

            return (
              <input
                key={slotKey}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                disabled={disabled}
                value={displayChar}
                placeholder={placeholder}
                autoComplete="one-time-code"
                aria-label={`OTP digit ${i + 1}`}
                className={cn(
                  'flex items-center justify-center rounded-lg border text-center outline-none transition-all duration-150',
                  'placeholder:text-neutral-placeholder placeholder:font-normal',
                  sizeClass.slot,
                  sizeClass.font,
                  colorClass.border,
                  `focus:${colorClass.focus.split(' ').join(' focus:')}`,
                  isFilled && colorClass.filled,
                  disabled && 'cursor-not-allowed',
                  customClasses?.slot,
                )}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length > 0) {
                    // Take only the last typed character (handles overwrite)
                    handleInput(i, val[val.length - 1]);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
              />
            );
          })}
        </div>

        {error && <p className={cn('mt-1.5 text-13 text-error', customClasses?.error)}>{error}</p>}
      </div>
    );
  },
);

InputOtp.displayName = 'InputOtp';
