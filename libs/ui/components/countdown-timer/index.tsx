import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../helpers';
export type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const calculateTimeLeft = (targetDate: Date): TimeLeft => {
  const difference = +new Date(targetDate) - +new Date();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

export type CountdownTimerProps = {
  targetDate: Date;
  title?: string;
  className?: string;
};

type TimeDisplayItem = {
  key: keyof TimeLeft;
  value: number;
  type: string;
};

export default function CountdownTimer({ targetDate, title, className }: CountdownTimerProps) {
  const { t } = useTranslation('ui');
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeLeft(targetDate);
      setTimeLeft(newTime);

      if (
        newTime.days === 0 &&
        newTime.hours === 0 &&
        newTime.minutes === 0 &&
        newTime.seconds === 0
      ) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits: TimeDisplayItem[] = [
    { key: 'days', value: timeLeft.days, type: t('countdownTimer.days') },
    { key: 'hours', value: timeLeft.hours, type: t('countdownTimer.hours') },
    { key: 'minutes', value: timeLeft.minutes, type: t('countdownTimer.minutes') },
    { key: 'seconds', value: timeLeft.seconds, type: t('countdownTimer.seconds') },
  ];

  return (
    <div className={cn('flex flex-col mt-4  min-w-80', className)}>
      {title && (
        <div className="font-extrabold">
          <span className="text-lg">{title}</span>
        </div>
      )}
      <div className="flex items-center gap-2 mt-4 flex-1">
        {timeUnits.map(({ key, value, type }) => (
          <div
            key={key}
            className="flex flex-col items-center rounded-xl border border-primary-border bg-neutral-white px-3 py-2"
          >
            <span className="text-20 font-extrabold text-primary-clicked tracking-tighter">
              {value}
            </span>
            <span className="text-10 font-bold text-primary-border">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
