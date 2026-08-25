import {
  AnimatePresence,
  motion,
  type TargetAndTransition,
  type VariantLabels,
  type Variants,
} from 'framer-motion';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/button';
import { type IconName, RenderIcon } from '../../components/icons';
import { cn } from '../../helpers/utils';

// ─── Animations ─────────────────────────────────────────────────────────────

const modalAnimation: Variants = {
  hidden: { y: '-100vh', opacity: 0, scale: 0.8 },
  visible: {
    y: '0',
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, type: 'spring', damping: 20, stiffness: 300 },
  },
  exit: { y: '100vh', opacity: 0, scale: 0.8 },
};

const backdropAnimation: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ─── Backdrop ────────────────────────────────────────────────────────────────

export const Backdrop = ({
  children,
  onClick,
  className,
  variants,
  exit,
  initial,
  animate,
}: {
  variants?: Variants;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  exit?: VariantLabels | TargetAndTransition;
  initial?: boolean | VariantLabels;
  animate?: boolean | VariantLabels | TargetAndTransition;
}) => (
  <motion.div
    onClick={onClick}
    variants={variants}
    initial={initial}
    animate={animate}
    exit={exit}
    className={cn(
      'modal-backdrop fixed inset-0 z-[9999] flex h-full w-full items-center justify-center bg-black/50',
      className,
    )}
  >
    {children}
  </motion.div>
);

// ─── ModalBase ───────────────────────────────────────────────────────────────

export type ModalBaseProps = {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  classNameBackdrop?: string;
};

export const ModalBase = ({
  onClose,
  isOpen,
  children,
  className,
  classNameBackdrop,
}: ModalBaseProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tree = (
    <AnimatePresence initial={false} mode="wait" onExitComplete={() => null}>
      {isOpen && (
        <Backdrop
          key="modal-overlay"
          className={classNameBackdrop}
          onClick={onClose}
          variants={backdropAnimation}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className={cn('modal bg-neutral-white shadow-2xl rounded-lg', className)}
            variants={modalAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(tree, document.body);
};

// ─── ModalConfirm ────────────────────────────────────────────────────────────
type ModalConfirmProps = Omit<ModalBaseProps, 'children'> & {
  onCancel?: () => void;
  cancelLabel?: string;
  cancelIcon?: IconName;
  classNameCancel?: string;

  onSubmit?: () => void;
  submitLabel?: string;
  submitIcon?: IconName;
  isLoading?: boolean;
  classNameSubmit?: string;

  message?: string;
  warning?: string;

  actions?: ReactNode;
  iconMain?: IconName;
  submitColor?: 'primary' | 'secondary' | 'success' | 'error' | 'pending' | 'neutral';
};

export const ModalConfirm = ({
  onCancel,
  cancelIcon,
  cancelLabel,
  classNameCancel,
  onSubmit,
  submitIcon,
  submitLabel,
  classNameSubmit,
  onClose,
  actions,
  isLoading,
  message = 'Are you sure you want to delete this item?',
  iconMain = 'exclamation-triangle',
  isOpen,
  warning,
  submitColor = 'primary',
}: ModalConfirmProps) => {
  const renderActions = useMemo(() => {
    if (actions) return actions;
    return (
      <div className="flex justify-center items-center gap-3 mt-5">
        <Button onClick={onCancel} icon={cancelIcon} size="small" className={classNameCancel}>
          {cancelLabel ?? 'No, cancel'}
        </Button>
        <Button
          onClick={onSubmit}
          icon={submitIcon ?? 'trash'}
          className={cn(classNameSubmit)}
          color={submitColor ?? 'error'}
          size="small"
          loading={isLoading}
        >
          {submitLabel ?? "Yes, I'm sure"}
        </Button>
      </div>
    );
  }, [
    actions,
    isLoading,
    cancelIcon,
    cancelLabel,
    submitIcon,
    submitLabel,
    classNameCancel,
    classNameSubmit,
    onSubmit,
    onCancel,
    submitColor,
  ]);

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} className="max-w-[500px]">
      <div className="flex flex-col py-2 pb-4 px-4">
        <div className="w-full flex justify-end pb-1">
          <button type="button" onClick={onClose}>
            <RenderIcon className="!w-5 !h-5 text-neutral-border" name="x-mark" />
          </button>
        </div>

        <div className="w-full flex items-center flex-col justify-center">
          {iconMain && <RenderIcon name={iconMain} className="!w-14 !h-14 text-pending" />}
          {message && (
            <p className="mt-3 font-medium text-neutral-text-secondary px-5 text-center">
              {message}
            </p>
          )}
        </div>

        {warning && (
          <div className="bg-error-bg rounded-md py-3 px-2 text-error text-sm mt-5">
            <div className="flex items-center gap-1">
              <RenderIcon name="exclamation-triangle" className="text-error !w-4 !h-4 mb-[2px]" />
              <span className="font-bold">Warning</span>
            </div>
            <p className="mt-1">{warning}</p>
          </div>
        )}

        {renderActions}
      </div>
    </ModalBase>
  );
};
