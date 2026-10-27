import { cn, formatDate } from '../../helpers';
import { RenderIcon } from '../icons';

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
  if (step.done) {
    return 'done';
  } else if (step.current) {
    return 'current';
  } else {
    return 'disabled';
  }
}

export function OrderTimeline({
  steps,
  orientation = Orientation.VERTICAL,
  className,
}: OrderTimelineProps) {
  if (!steps?.length) return null;
  if (orientation === Orientation.HORIZONTAL) {
    return <HorizontalOrderTimeline steps={steps} className={className} />;
  }
  return <VerticalOrderTimeline steps={steps} className={className} />;
}
function VerticalOrderTimeline({
  steps,
  className,
}: {
  steps: OrderTimelineStep[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1 w-full', className)}>
      {steps?.map((step, index) => {
        const status = getStepState(step);
        return (
          <div className={cn('flex gap-2 relative pb-6')} key={index}>
            <div className={cn('flex flex-col gap-2')}>
              <div className="flex flex-col justify-center items-center">
                <RenderIcon
                  name="circle"
                  className={cn('!w-3 !h-3 z-10', {
                    'text-success fill-success': status === 'done',
                    'text-primary fill-primary': status === 'current',
                    'text-neutral-disable': status === 'disabled',
                  })}
                />
                {index < steps?.length - 1 && (
                  <div
                    className={cn('absolute top-0 bottom-0  left-1 w-0.5 ', {
                      'bg-success': status === 'done',
                      'bg-neutral-disable': status !== 'done',
                    })}
                  ></div>
                )}
              </div>
            </div>
            <div className={cn('text-sm flex flex-col gap-2 ml-2 font-semibold')}>
              <div className=" flex text-sm font-semibold gap-2">
                <span
                  className={cn('', {
                    'text-neutral-disable': status === 'disabled',
                  })}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span
                    className={cn('', {
                      'text-neutral-disable': status === 'disabled',
                    })}
                  >
                    · {step.description}
                  </span>
                )}
              </div>
              <div className="">
                <span
                  className={cn('text-neutral-text-secondary', {
                    'text-neutral-disable': status === 'disabled',
                  })}
                >
                  {formatDate(step.date, 'dd/MM HH:mm')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
function HorizontalOrderTimeline({
  steps,
  className,
}: {
  steps: OrderTimelineStep[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-row items-center w-full', className)}>
      {steps?.map((step, index) => {
        const status = getStepState(step);
        return (
          <div
            className={cn('flex flex-row items-center', {
              'flex-1': index < steps.length - 1,
            })}
            key={index}
          >
            <div className="flex flex-row items-center gap-2">
              <RenderIcon
                name={status === 'done' ? 'circle-check' : 'circle'}
                className={cn('!w-3 !h-3', {
                  'fill-success text-neutral-white': status === 'done',
                  'fill-primary text-neutral-white': status === 'current',
                  'text-neutral-disable': status === 'disabled',
                })}
              />

              <span
                className={cn('text-sm font-semibold', {
                  'text-neutral-disable': status === 'disabled',
                })}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn('h-px flex-1 mx-2', {
                  'bg-success': status === 'done',
                  'bg-neutral-disable': status !== 'done',
                })}
              ></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
