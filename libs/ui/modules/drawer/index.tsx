import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../helpers/utils';

const backdropAnimation: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function drawerPanelVariants(placement: 'left' | 'right'): Variants {
  const off = placement === 'right' ? '100%' : '-100%';
  return {
    hidden: { x: off, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', damping: 28, stiffness: 320 },
    },
    exit: {
      x: off,
      opacity: 0,
      transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
    },
  };
}

export type DrawerBaseProps = {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  /** Panel (slide-out) surface */
  className?: string;
  classNameBackdrop?: string;
  placement?: 'left' | 'right';
};

export function DrawerBase({
  isOpen,
  onClose,
  children,
  className,
  classNameBackdrop,
  placement = 'right',
}: DrawerBaseProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const rounded = placement === 'right' ? 'rounded-l-lg' : 'rounded-r-lg';
  const inset = placement === 'right' ? 'right-0' : 'left-0';

  const layer = (
    <AnimatePresence initial={false} mode="sync" onExitComplete={() => null}>
      {isOpen && (
        <motion.div
          key="drawer-backdrop"
          aria-hidden
          className={cn('fixed inset-0 z-[9999] bg-black/50', classNameBackdrop)}
          variants={backdropAnimation}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
      )}
      {isOpen && (
        <motion.div
          key="drawer-panel"
          role="dialog"
          aria-modal="true"
          className={cn(
            'modal fixed inset-y-0 z-[10000] flex w-full max-w-[min(100vw-1.5rem,22rem)] flex-col bg-neutral-white shadow-2xl',
            // Full visual viewport (mobile URL bar); avoids a thin strip vs `top-0 bottom-0` + nested overflow
            'h-[100dvh] max-h-[100dvh] min-h-0',
            inset,
            rounded,
            className,
          )}
          variants={drawerPanelVariants(placement)}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(layer, document.body);
}

export const Drawer = DrawerBase;

export type DrawerProps = DrawerBaseProps;
