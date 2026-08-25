import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './index';

const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { key: 'home', title: 'Dashboard', href: '#' },
      { key: 'products', title: 'Products', href: '#' },
      { key: 'detail', title: 'Nike Air Max 270' },
    ],
  },
};

export const WithDescription: Story = {
  args: {
    items: [
      { key: 'home', title: 'Dashboard', href: '#' },
      { key: 'orders', title: 'Orders' },
    ],
    description: 'Manage and track every order placed in the storefront.',
  },
};

export const WithClickHandlers: Story = {
  args: {
    items: [
      { key: 'home', title: 'Dashboard', onClick: () => alert('Go to dashboard') },
      { key: 'settings', title: 'Settings' },
    ],
  },
};
