import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type CountdownTimerProps = {
  targetDate: Date | string;
  title?: string;
};

export default function CountdownTimer({ targetDate, title }: CountdownTimerProps) {
  const { t } = useTranslation('ui');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeft = {};

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      setTimeLeft(timeLeft as any);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex flex-col mt-4  min-w-80">
      <div className="">
        <span className="text-sm text-neutral-text-secondary">{title}</span>
      </div>
      <div className="flex items-center gap-2 flex-1">
        <div className=" flex flex-col items-center rounded-xl border border-primary-border bg-neutral-white px-3 py-2">
          <span className="text-20 font-extrabold text-primary-clicked tracking-tighter">
            {timeLeft.days}
          </span>
          <span className="text-10 font-bold text-primary-border">{t('countdownTimer.days')}</span>
        </div>
        <div className=" flex flex-col items-center rounded-xl border border-primary-border bg-neutral-white px-3 py-2">
          <span className="text-20 font-extrabold text-primary-clicked tracking-tighter">
            {timeLeft.hours}
          </span>
          <span className="text-10 font-bold text-primary-border">{t('countdownTimer.hours')}</span>
        </div>
        <div className=" flex flex-col items-center rounded-xl border border-primary-border bg-neutral-white px-3 py-2">
          <span className="text-20 font-extrabold text-primary-clicked tracking-tighter">
            {timeLeft.minutes}
          </span>
          <span className="text-10 font-bold text-primary-border">
            {t('countdownTimer.minutes')}
          </span>
        </div>
        <div className=" flex flex-col items-center rounded-xl border border-primary-border bg-neutral-white px-3 py-2">
          <span className="text-20 font-extrabold text-primary-clicked tracking-tighter">
            {timeLeft.seconds}
          </span>
          <span className="text-10 font-bold text-primary-border">
            {t('countdownTimer.seconds')}
          </span>
        </div>
      </div>
    </div>
  );
}
