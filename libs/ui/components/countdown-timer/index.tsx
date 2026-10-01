import { cn } from '../../helpers';

export type PropsCountdownTimer = {
  label: string;
  date: string | Date;
  className?: string;
  onExpire?: () => void;
};

export function CountdownTimer(props: PropsCountdownTimer) {
  const { label, date, className } = props;
  return (
    <div className={`w-full flex items-center justify-center ${className}`}>
      <span className={cn(``)}>{date}</span>
    </div>
  );
}
