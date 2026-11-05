import { Timeline } from '@itclabs/react-ui';
import { formatDate } from '../../helpers';
export type OrderTimelineStep = {
  label: string;
  done?: boolean;
  current?: boolean;
  description?: string;
  date: Date;
};
export enum Orientation {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}
export type OrderTimelineProps = {
  steps: OrderTimelineStep[];
  orientation?: Orientation;
  className?: string;
};
export function getStepState(step: OrderTimelineStep) {
  return step.done ? 'done' : step.current ? 'current' : 'disabled';
}
export function OrderTimeline({
  steps,
  orientation = Orientation.VERTICAL,
  className,
}: OrderTimelineProps) {
  if (!steps.length) return null;
  const current = steps.findIndex((step) => step.current);
  const lastDone = steps.reduce((last, step, index) => (step.done ? index : last), -1);
  const active = current >= 0 ? current : lastDone;
  return (
    <Timeline
      className={className}
      orientation={orientation}
      activeId={active >= 0 ? String(active) : undefined}
      items={steps.map((step, index) => ({
        id: String(index),
        title: step.label,
        description: step.description,
        time: formatDate(step.date, 'dd/MM HH:mm'),
        dateTime: Number.isNaN(step.date.getTime()) ? undefined : step.date.toISOString(),
        status: step.done ? 'success' : step.current ? 'info' : 'default',
      }))}
    />
  );
}
