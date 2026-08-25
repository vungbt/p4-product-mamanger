import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * `text-{n}` utilities from `config/tailwind/tailwind.preset` (`fontSize` numeric keys).
 * Default tailwind-merge treats them like `text-red-500` (text-color), so e.g.
 * `cn('text-12', 'text-neutral-text-primary')` would drop one class. Register them as font-size.
 * @see https://github.com/dcastil/tailwind-merge/blob/main/docs/configuration.md
 */
const NUMERIC_TEXT_FONT_SIZES = [
  '8',
  '10',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '20',
  '24',
  '28',
  '32',
  '36',
  '40',
  '48',
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...NUMERIC_TEXT_FONT_SIZES] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
