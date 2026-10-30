import type { Meta, StoryObj } from '@storybook/react-vite';
import { StorefrontHeader } from './index';

const meta = {
  title: 'UI/StorefrontHeader',
  component: StorefrontHeader,
  tags: ['autodocs'],
  argTypes: {
    onSearch: {
      action: 'onSearch',
    },
  },
} satisfies Meta<typeof StorefrontHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    return (
      <div className="">
        <StorefrontHeader {...args} />
      </div>
    );
  },
  args: {
    navItems: [
      { label: 'Sản phẩm', href: '#', active: true },
      { label: 'Đơn hàng', href: '#', active: false },
      { label: 'Tài khoản', href: '#', active: false },
    ],
    cartCount: 3,
    brandName: 'P4',
    user: {
      name: 'Phuong Dong',
      avatar: '',
    },
    logo: '',
    onSearch: (value) => console.log(value),
  },
};

export const NoItemsInCart: Story = {
  render: (args) => {
    return (
      <div className="">
        <StorefrontHeader {...args} />
      </div>
    );
  },
  args: {
    navItems: [
      { label: 'Sản phẩm', href: '#', active: true },
      { label: 'Đơn hàng', href: '#', active: false },
      { label: 'Tài khoản', href: '#', active: false },
    ],
    cartCount: 0,
    brandName: 'P4',
    user: {
      name: 'Ngọc Lan',
      avatar: '',
    },
    logo: '',
    onSearch: (value) => console.log(value),
  },
};
