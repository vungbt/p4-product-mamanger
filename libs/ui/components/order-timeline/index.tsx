import { cn } from '../../helpers';

export type OrderTimelineProps = {
  steps: {
    label: string;
    done?: boolean;
    current: boolean;
    description?: string;
    date?: Date;
  }[];
  orientation: 'vertical' | 'horizontal';
  className?: string;
};

export function OrderTimeline({ steps, orientation = 'vertical', className }: OrderTimelineProps) {
  if (orientation === 'vertical') {
    return (
      <>
        {steps?.map((step, index) => (
          <div
            className={cn('', {
              hidden: !step.current && step.done === false,
            })}
            key={index}
          >
            <div className={cn('flex ', className)}>
              <div className="grid grid-cols-2">
                <div
                  className={cn('flex rounded-full w-3 h-3 ', {
                    'bg-success': step.done,
                    'bg-primary': !step.done,
                    'bg-neutral-disable': !step.done,
                  })}
                ></div>
                <div
                  className={cn('h-16 w-px ml-1', {
                    'bg-success': step.done,
                    'bg-primary': !step.done,
                    'bg-neutral-disable': !step.done,
                  })}
                ></div>
                <div
                  className={cn('text-xs flex justify-between items-center gap-2', {
                    'text-success': step.done,
                    'text-primary': !step.done,
                    'text-neutral-disable': !step.done,
                  })}
                >
                  {step.done}
                </div>
              </div>
              <div
                className={cn('text-sm flex flex-col gap-2 ml-2', {
                  hidden: !step.current,
                })}
              >
                <div className=" flex text-sm font-semibold gap-2">
                  {step.label}
                  {step.description && <span className="">{step.description}</span>}
                </div>
                <div className="flex flex-row gap-2">
                  <span className={'flex gap-2'}>{step.date?.toLocaleDateString()}</span>
                  <span className={'flex gap-2'}>{step.date?.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }
}
