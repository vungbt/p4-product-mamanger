import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Button } from '../../components/button';
import { ModalBase, ModalConfirm } from './index';

const meta = {
  title: 'Modules/Modal',
  component: ModalBase,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    isOpen: false,
    children: null,
  },
} satisfies Meta<typeof ModalBase>;

export default meta;
type Story = StoryObj<typeof meta>;

function BasicModalDemo() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Button onClick={() => setIsOpen(true)}>Open modal</Button>
      <ModalBase isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-[420px] p-6">
        <h3 className="text-16 font-semibold text-neutral-text-primary">Modal title</h3>
        <p className="mt-2 text-14 text-neutral-text-secondary">
          `ModalBase` handles the backdrop, animation and `document.body` portal — compose your own
          content inside it.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" color="neutral" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>Confirm</Button>
        </div>
      </ModalBase>
    </div>
  );
}

function ConfirmModalDemo() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Button color="error" onClick={() => setIsOpen(true)}>
        Delete product
      </Button>
      <ModalConfirm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCancel={() => setIsOpen(false)}
        onSubmit={fn()}
        message="Are you sure you want to delete this product?"
        warning="This action cannot be undone."
      />
    </div>
  );
}

export const Basic: Story = {
  render: () => <BasicModalDemo />,
};

export const Confirm: Story = {
  render: () => <ConfirmModalDemo />,
};
