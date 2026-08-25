import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { Toaster, toastError, toastInfo, toastSuccess, toastWarning } from './index';

function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Toaster position="top-right" />
      <Button color="success" onClick={() => toastSuccess('Product saved successfully')}>
        Success
      </Button>
      <Button color="error" onClick={() => toastError('Failed to delete product')}>
        Error
      </Button>
      <Button color="pending" onClick={() => toastWarning('Stock is running low')}>
        Warning
      </Button>
      <Button color="secondary" onClick={() => toastInfo('New order received')}>
        Info
      </Button>
    </div>
  );
}

const meta = {
  title: 'Components/Toast',
  component: ToastDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Mount `<Toaster richColors />` once near the app root, then call `toastSuccess`/`toastError`/`toastWarning`/`toastInfo` from anywhere. Colors/radius/padding are themed via `toast.css` (Sonner CSS vars + `data-sonner-toast` overrides) to match the design tokens, and each type renders a 20px solid-color badge (check icon for success, bold "!"/"i" glyph for error/pending/info) instead of Sonner\'s default outline icons.',
      },
    },
  },
} satisfies Meta<typeof ToastDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
