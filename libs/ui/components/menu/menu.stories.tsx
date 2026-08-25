import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { IconButton } from '../icon-button';
import { Menu } from './menu';

const meta = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`Menu` wraps `@szhsin/react-menu`. It portals by default (`portal`), so it always renders above the story canvas.',
      },
    },
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    trigger: <IconButton icon="ellipsis-vertical" color="neutral" variant="ghost" />,
    items: [
      { key: 'edit', label: 'Edit', onClick: fn() },
      { key: 'duplicate', label: 'Duplicate', onClick: fn() },
      { key: 'delete', label: 'Delete', danger: true, onClick: fn() },
    ],
  },
};

export const WithDisabledItem: Story = {
  args: {
    trigger: <IconButton icon="ellipsis-vertical" color="neutral" variant="ghost" />,
    items: [
      { key: 'edit', label: 'Edit', onClick: fn() },
      { key: 'archive', label: 'Archive (unavailable)', disabled: true },
      { key: 'delete', label: 'Delete', danger: true, onClick: fn() },
    ],
  },
};
