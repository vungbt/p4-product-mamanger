import { format } from 'date-fns';
import { cn } from '../../helpers';
import { RenderIcon } from '../icons';

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
  /*dùng format của date-fns để định dạng ngày tháng */
  const formatDate = (date: Date) => {
    return format(date, 'dd/MM HH:mm');
  };
  if (orientation === 'vertical')
    return (
      <div className={cn('flex flex-col gap-2 w-full', className)}>
        {steps?.map((step, index) => (
          <div className={cn('flex gap-2')} key={index}>
            <div className={cn('flex flex-col gap-2')}>
              <div className="flex flex-col justify-center items-center">
                <RenderIcon
                  name="circle"
                  className={cn('!w-3 !h-3 z-10', {
                    'text-success fill-success': step.done === true,
                    'text-primary fill-primary': step.done !== true && step.current === true,
                    'text-neutral-disable': step.done === false && step.current === false,
                  })}
                />
                {index < steps?.length - 1 && (
                  <div
                    className={cn('h-16 w-px mb-2', {
                      'bg-success': step.done === true,
                      'bg-primary': step.done !== true && step.current === true,
                      'bg-neutral-disable': step.done === false,
                    })}
                  ></div>
                )}
              </div>
            </div>
            <div className={cn('text-sm flex flex-col gap-2 ml-2')}>
              <div className=" flex text-sm font-semibold gap-2">
                <span
                  className={cn('text-sm font-semibold', {
                    'text-neutral-disable': step.done === false && step.current === false,
                  })}
                >
                  {step.label}
                </span>
                {step.description && <span className="">{step.description}</span>}
              </div>
              <div className="">
                <span
                  className={cn('text-sm font-semibold', {
                    'text-neutral-disable': step.done === false && step.current === false,
                  })}
                >
                  {formatDate?.(step.date!)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  else {
    return (
      <div className={cn('flex flex-row items-center w-full', className)}>
        {steps?.map((step, index) => (
          <div
            className={cn('flex flex-row items-center', {
              'flex-1': index < steps.length - 1,
            })}
            key={index}
          >
            <div className="flex flex-row items-center gap-2">
              <RenderIcon
                name={step.done ? 'circle-check' : 'circle'}
                className={cn('!w-3 !h-3', {
                  'fill-success text-neutral-white': step.done === true,
                  'fill-primary text-neutral-white': step.done !== true && step.current === true,
                  'text-neutral-disable': step.done !== true && step.current === false,
                })}
              />

              <span
                className={cn('text-sm font-semibold', {
                  'text-neutral-disable': step.done !== true && step.current === false,
                })}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn('h-px flex-1 mx-2', {
                  'bg-success': step.done === true,
                  'bg-neutral-disable': step.done !== true,
                })}
              ></div>
            )}
          </div>
        ))}
      </div>
    );
  }
}
