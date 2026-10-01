import { useEffect, useState } from 'react';

export type CountdownTimerProps = {
  targetDate: Date | string;
};

export default function CountdownTimer({ value, onChange }: CountdownTimerProps) {
  return (
    <div>
      <h1>Countdown Timer</h1>
    </div>
  );
}
