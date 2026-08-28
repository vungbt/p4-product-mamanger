import type { EmblaOptionsType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../helpers/utils';
import { IconButton } from '../icon-button';

export type CarouselProps = {
  slidesPerView?: number | { sm?: number; md?: number; lg?: number };
  gap?: number;
  autoplay?: boolean | { delay: number };
  loop?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  onSlideChange?: (index: number) => void;
  children: React.ReactNode;
  className?: string;
  customClasses?: {
    root?: string;
    viewport?: string;
    container?: string;
    slide?: string;
    arrow?: string;
    dots?: string;
    dot?: string;
  };
};

export const Carousel: React.FC<CarouselProps> = ({
  slidesPerView = 1,
  gap = 16,
  autoplay = false,
  loop = false,
  showDots = true,
  showArrows = true,
  onSlideChange,
  children,
  className,
  customClasses,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof Autoplay> | null>(null);

  const options: EmblaOptionsType = {
    loop,
    align: 'start',
    containScroll: loop ? undefined : 'trimSnaps',
    slidesToScroll: 1,
  };

  const plugins: ReturnType<typeof Autoplay>[] = [];
  if (autoplay) {
    const delay = typeof autoplay === 'object' ? autoplay.delay : 3500;
    const plugin = Autoplay({ delay, stopOnInteraction: false, stopOnMouseEnter: true });
    autoplayRef.current = plugin;
    plugins.push(plugin);
  }

  const [emblaRef, emblaApi] = useEmblaCarousel(options, plugins);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    onSlideChange?.(index);
  }, [emblaApi, onSlideChange]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const getSlideStyle = (): React.CSSProperties => {
    const perView = typeof slidesPerView === 'number' ? slidesPerView : (slidesPerView.lg ?? 1);
    const totalGap = gap * (perView - 1);
    return {
      flex: `0 0 calc((100% - ${totalGap}px) / ${perView})`,
      minWidth: 0,
      paddingLeft: gap / 2,
      paddingRight: gap / 2,
    };
  };

  const childArray = Array.isArray(children) ? children : [children];

  return (
    <div className={cn('relative group', className, customClasses?.root)}>
      <div ref={emblaRef} className={cn('overflow-hidden rounded-lg', customClasses?.viewport)}>
        <div
          className={cn('flex', customClasses?.container)}
          style={{ marginLeft: -(gap / 2), marginRight: -(gap / 2) }}
        >
          {childArray.map((child, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: slides are positional, not reordered
              key={index}
              className={cn('min-w-0', customClasses?.slide)}
              style={getSlideStyle()}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows && (
        <>
          <IconButton
            icon="chevron-left"
            color="neutral"
            variant="outline"
            shape="circle"
            onClick={scrollPrev}
            disabled={!loop && !canScrollPrev}
            aria-label="Previous slide"
            className={cn(
              'absolute top-1/2 -translate-y-1/2 -left-4 z-10',
              'w-[38px] h-[38px] shadow-md',
              'disabled:opacity-35 disabled:pointer-events-none',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:!bg-primary hover:!border-primary hover:!text-white',
              customClasses?.arrow,
            )}
          />
          <IconButton
            icon="chevron-right"
            color="neutral"
            variant="outline"
            shape="circle"
            onClick={scrollNext}
            disabled={!loop && !canScrollNext}
            aria-label="Next slide"
            className={cn(
              'absolute top-1/2 -translate-y-1/2 -right-4 z-10',
              'w-[38px] h-[38px] shadow-md',
              'disabled:opacity-35 disabled:pointer-events-none',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:!bg-primary hover:!border-primary hover:!text-white',
              customClasses?.arrow,
            )}
          />
        </>
      )}

      {showDots && scrollSnaps.length > 1 && (
        <div className={cn('flex justify-center gap-1.5 mt-4', customClasses?.dots)}>
          {scrollSnaps.map((_, index) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: dots are positional indicators
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                'h-[7px] rounded-full border-none cursor-pointer transition-all duration-200',
                index === selectedIndex
                  ? 'w-5 bg-primary'
                  : 'w-[7px] bg-neutral-border hover:bg-neutral-placeholder',
                customClasses?.dot,
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

Carousel.displayName = 'Carousel';
