import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../../components/button';
import { Drawer } from './index';

const meta = {
  title: 'Modules/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: {
    // Drawer portals into document.body — let it render above the canvas wrapper.
    layout: 'fullscreen',
  },
  args: {
    isOpen: false,
    children: null,
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function DrawerDemo({ placement = 'right' }: { placement?: 'left' | 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Button onClick={() => setIsOpen(true)}>Open drawer ({placement})</Button>
      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} placement={placement}>
        <div className="flex h-full flex-col p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-16 font-semibold text-neutral-text-primary">Drawer title</h3>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close">
              ✕
            </button>
          </div>
          <p className="text-14 text-neutral-text-secondary">
            Drawer content slides in from the {placement} and portals to `document.body`.
          </p>
        </div>
      </Drawer>
    </div>
  );
}

export const FromRight: Story = {
  render: () => <DrawerDemo placement="right" />,
};

export const FromLeft: Story = {
  render: () => <DrawerDemo placement="left" />,
};
