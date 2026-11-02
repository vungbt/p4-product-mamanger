import type { Meta, StoryObj } from '@storybook/react-vite';

import { MobileHeader } from './index';

const meta: Meta<typeof MobileHeader> = {
  title: 'Modules/MobileHeader',
  component: MobileHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MobileHeader>;

export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <MobileHeader {...args} />
    </div>
  ),
  args: {
    lead: 'logo',
    time: '9:41',
    title: 'P4',
    cartCount: 4,
    label: 'P4 Shop',
    showCart: true,
  },
};

export const WithBack: Story = {
  render: (args) => (
    <div className="w-96">
      <MobileHeader {...args} />
    </div>
  ),
  args: {
    lead: 'back',
    time: '9:41',
    title: 'Giỏ hàng',
    cartCount: 4,
    label: 'P4 Shop',
    onBack: () => {},
  },
};

export const WithoutCart: Story = {
  render: (args) => (
    <div className="w-96">
      <MobileHeader {...args} />
    </div>
  ),
  args: {
    lead: 'logo',
    time: '9:41',
    title: 'P4',
    cartCount: 4,
    label: 'P4 Shop',
    showCart: false,
  },
};

export const WithoutCartAndBack: Story = {
  render: (args) => (
    <div className="w-96">
      <MobileHeader {...args} />
    </div>
  ),
  args: {
    lead: 'back',
    time: '9:41',
    title: 'Giỏ hàng',
    cartCount: 0,
    label: 'P4 Shop',
    onBack: () => {},
  },
};
