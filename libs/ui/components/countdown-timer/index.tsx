import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../helpers';

export type CountdownTimerProps = {
  targetDate: Date | string;
  title?: string;
  className?: string;
};

export default function CountdownTimer({ targetDate, title, className }: CountdownTimerProps) {
  const { t } = useTranslation('ui');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const calculateTimeLeft = () => {
      let targetTime = 0;

      // Nếu targetDate là chuỗi dạng "YYYY-MM-DD", chuyển nó về Date cục bộ (local time)
      // bằng cách tách chuỗi và truyền vào new Date(year, monthIndex, day)
      if (typeof targetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(targetDate.trim())) {
        const [year, month, day] = targetDate.trim().split('-');
        targetTime = +new Date(Number(year), Number(month) - 1, Number(day));
      } else {
        targetTime = +new Date(targetDate);
      }

      const difference = targetTime - +new Date();
      let timeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      } else {
        if (timer) clearInterval(timer);
      }

      setTimeLeft(timeLeft);
    };
    timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className={cn('flex flex-col mt-4  min-w-80', className)}>
      <div className="font-extrabold">
        <span className="text-lg">{title}</span>
      </div>
      <div className="flex items-center gap-2 mt-4 flex-1">
        {[
          { key: 'days', value: timeLeft.days, label: t('countdownTimer.days') },
          { key: 'hours', value: timeLeft.hours, label: t('countdownTimer.hours') },
          { key: 'minutes', value: timeLeft.minutes, label: t('countdownTimer.minutes') },
          { key: 'seconds', value: timeLeft.seconds, label: t('countdownTimer.seconds') },
        ].map(({ key, value, label }) => (
          <div
            key={key}
            className="flex flex-col items-center rounded-xl border border-primary-border bg-neutral-white px-3 py-2"
          >
            <span className="text-20 font-extrabold text-primary-clicked tracking-tighter">
              {value}
            </span>
            <span className="text-10 font-bold text-primary-border">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
