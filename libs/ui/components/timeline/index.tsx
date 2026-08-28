import type React from 'react';
import { cn } from '../../helpers/utils';
import { type IconName, RenderIcon } from '../icons';

export type TimelineStep = {
  label: string;
  subtitle?: string;
  done?: boolean;
  current?: boolean;
  icon?: IconName;
};

type TimelineProps = {
  steps: TimelineStep[];
  variant?: 'vertical' | 'horizontal';
  iconSize?: number;
  dotSize?: 12 | 16;
  className?: string;
  customClasses?: {
    root?: string;
    step?: string;
    dot?: string;
    line?: string;
    label?: string;
    subtitle?: string;
  };
};

export const Timeline: React.FC<TimelineProps> = ({
  steps,
  variant = 'vertical',
  iconSize = 20,
  dotSize = 12,
  className,
  customClasses,
}) => {
  if (variant === 'horizontal') {
    return (
      <HorizontalTimeline
        steps={steps}
        iconSize={iconSize}
        dotSize={dotSize}
        className={className}
        customClasses={customClasses}
      />
    );
  }
  return (
    <VerticalTimeline
      steps={steps}
      iconSize={iconSize}
      dotSize={dotSize}
      className={className}
      customClasses={customClasses}
    />
  );
};

Timeline.displayName = 'Timeline';

function VerticalTimeline({
  steps,
  iconSize = 20,
  dotSize = 12,
  className,
  customClasses,
}: Omit<TimelineProps, 'variant'>) {
  const showTick = dotSize === 16;
  const dotClass = dotSize === 16 ? 'w-4 h-4' : 'w-3 h-3';
  const dotMt = dotSize === 16 ? 'mt-[3px]' : 'mt-[5px]';
  const lineDotLeft = dotSize === 16 ? '7px' : '5px';
  const lineDotTop = dotSize === 16 ? '20px' : '16px';
  return (
    <div className={cn('flex flex-col', className, customClasses?.root)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const hasIcon = !!step.icon;
        const isActive = step.done || step.current;

        const dotColor = step.done
          ? 'bg-success border-success text-white'
          : step.current
            ? 'bg-primary border-primary text-white'
            : 'bg-neutral-white border-neutral-border';

        const iconColor = step.done
          ? 'text-success'
          : step.current
            ? 'text-primary'
            : 'text-neutral-placeholder';

        const lineColor = step.done ? 'bg-success' : 'bg-neutral-divider';
        const lineLeft = hasIcon ? `${iconSize / 2 - 1}px` : lineDotLeft;
        const lineTop = hasIcon ? `${iconSize + 4}px` : lineDotTop;

        return (
          <div
            key={step.label}
            className={cn('relative flex gap-3', !isLast && 'pb-6', customClasses?.step)}
          >
            {!isLast && (
              <div
                className={cn('absolute bottom-0 w-[2px]', lineColor, customClasses?.line)}
                style={{ left: lineLeft, top: lineTop }}
              />
            )}
            {hasIcon ? (
              <div className={cn('relative z-10 flex-shrink-0 mt-[1px]', iconColor)}>
                <RenderIcon name={step.icon!} style={{ width: iconSize, height: iconSize }} />
              </div>
            ) : (
              <div
                className={cn(
                  `relative z-10 ${dotClass} rounded-full border-2 ${dotMt} flex-shrink-0`,
                  showTick && 'flex items-center justify-center',
                  dotColor,
                  customClasses?.dot,
                )}
              >
                {showTick && step.done && (
                  <RenderIcon name="check" style={{ width: 10, height: 10 }} />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'text-ui-body-strong',
                  !step.done && !step.current && 'text-neutral-placeholder',
                  customClasses?.label,
                )}
              >
                {step.label}
              </div>
              {step.subtitle && (
                <div className={cn('text-12 text-neutral-text-secondary', customClasses?.subtitle)}>
                  {step.subtitle}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalTimeline({
  steps,
  iconSize = 20,
  dotSize = 12,
  className,
  customClasses,
}: Omit<TimelineProps, 'variant'>) {
  const showTick = dotSize === 16;
  const dotClass = dotSize === 16 ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className={cn('flex items-center w-full', className, customClasses?.root)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const hasIcon = !!step.icon;

        const dotColor = step.done
          ? 'bg-success border-success text-white'
          : step.current
            ? 'bg-primary border-primary text-white'
            : 'bg-neutral-white border-neutral-border';

        const iconColor = step.done
          ? 'text-success'
          : step.current
            ? 'text-primary'
            : 'text-neutral-placeholder';

        const lineColor = step.done ? 'bg-success-border' : 'bg-neutral-divider';
        const textColor = step.done
          ? 'text-neutral-text-primary'
          : step.current
            ? 'text-neutral-text-primary'
            : 'text-neutral-placeholder';

        return (
          <div
            key={step.label}
            className={cn('flex items-center', !isLast && 'flex-1', customClasses?.step)}
          >
            <div className="flex items-center gap-2">
              {hasIcon ? (
                <div className={cn('flex-shrink-0', iconColor)}>
                  <RenderIcon name={step.icon!} style={{ width: iconSize, height: iconSize }} />
                </div>
              ) : (
                <div
                  className={cn(
                    `${dotClass} rounded-full border-2 flex-shrink-0`,
                    showTick && 'flex items-center justify-center',
                    dotColor,
                    customClasses?.dot,
                  )}
                >
                  {showTick && step.done && (
                    <RenderIcon name="check" style={{ width: 10, height: 10 }} />
                  )}
                </div>
              )}
              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-ui-body-strong whitespace-nowrap',
                    textColor,
                    customClasses?.label,
                  )}
                >
                  {step.label}
                </span>
                {step.subtitle && (
                  <span
                    className={cn(
                      'text-12 whitespace-nowrap text-neutral-text-secondary',
                      customClasses?.subtitle,
                    )}
                  >
                    {step.subtitle}
                  </span>
                )}
              </div>
            </div>
            {!isLast && (
              <div
                className={cn('flex-1 h-0.5 mx-2.5 rounded-sm', lineColor, customClasses?.line)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
