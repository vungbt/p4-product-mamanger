import type { Meta, StoryObj } from '@storybook/react-vite';
import { MobileTabBar } from './index';

const meta = {
  title: 'Modules/MobileTabBar',
  component: MobileTabBar,
  args: {
    active: 'home',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MobileTabBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <MobileTabBar {...args} />
    </div>
  ),
  args: {
    active: 'home',
  },
};

export const WithShop: Story = {
  render: (args) => (
    <div className="w-80">
      <MobileTabBar {...args} />
    </div>
  ),
  args: {
    active: 'shop',
    cartCount: 100,
  },
};

export const WithOrder: Story = {
  render: (args) => (
    <div className="w-80">
      <MobileTabBar {...args} />
    </div>
  ),
  args: {
    active: 'orders',
  },
};

export const WithUser: Story = {
  render: (args) => (
    <div className="w-80">
      <MobileTabBar {...args} />
    </div>
  ),
  args: {
    active: 'account',
  },
};
