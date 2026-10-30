import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddressCard } from './index';

const meta = {
  title: 'Components/AddressCard',
  component: AddressCard,
  argTypes: {
    title: {
      control: {
        type: 'select',
      },
      options: ['Địa chỉ giao hàng', 'Địa chỉ thanh toán'],
    },
    fullName: {
      control: 'text',
    },
    phone: {
      control: 'text',
    },
    isDefault: {
      control: 'boolean',
    },
    address: {
      control: 'text',
    },
    badge: {
      control: 'text',
    },
  },
  tags: ['autodocs'],
} as Meta<typeof AddressCard>;

export default meta;

type Story = StoryObj<typeof AddressCard>;

export const Default: Story = {
  render: (args) => {
    return (
      <div className="p-4 w-96">
        <AddressCard {...args} />
      </div>
    );
  },
  args: {
    title: 'Địa chỉ giao hàng',
    fullName: 'Nguyễn Văn A',
    phone: '0123456789',
    badge: 'Mặc định',
    isDefault: true,
    address: 'Số 123, Đường ABC, Phường XYZ, Quận 1,Thành phố Hồ Chí Minh, Việt Nam',
  },
};

export const WithoutBadge: Story = {
  render: (args) => {
    return (
      <div className="p-4 w-96">
        <AddressCard {...args} />
      </div>
    );
  },
  args: {
    title: 'Địa chỉ giao hàng',
    fullName: 'Nguyễn Văn A',
    phone: '0865408611',
    isDefault: false,
    address: '109/12 Nguyễn Thượng Hiền',
  },
};
