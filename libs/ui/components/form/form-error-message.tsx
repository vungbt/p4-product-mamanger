import { cn } from '../../lib/utils';

type FormErrorMessageProps = {
  error: string;
  size?: 'small' | 'middle' | 'large';
  customClasses?: {
    root?: string;
    error?: string;
  };
};

const sizeClasses = {
  small: 'text-14',
  middle: 'text-14',
  large: 'text-16',
};

export const FormErrorMessage = ({
  error,
  size = 'middle',
  customClasses,
}: FormErrorMessageProps) => {
  return (
    <div className={cn('mt-1', customClasses?.root)}>
      <p className={cn('text-error px-0', sizeClasses[size], customClasses?.error)}>{error}</p>
    </div>
  );
};
