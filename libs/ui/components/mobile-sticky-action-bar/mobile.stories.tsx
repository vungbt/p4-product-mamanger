import type { Meta, StoryObj } from '@storybook/react-vite';
import { MobileStickyActionBar } from './index';

const meta: Meta<typeof MobileStickyActionBar> = {
  title: 'Components/MobileStickyActionBar',
  component: MobileStickyActionBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MobileStickyActionBar>;

export const Primary: Story = {
  args: {
    favorited: false,
    addCart: {
      label: 'Thêm Giỏ',
      onClick: () => alert('Thêm giỏ hàng'),
    },
    buy: {
      label: 'Mua Ngay',
      price: 1000000,
      onClick: () => alert('Mua ngay'),
    },
  },
};
export const Checkout: Story = {
  args: {
    checkout: {
      title: 'TỔNG CỘNG',
      price: 1000000,
      label: 'Đặt hàng',
      onClick: () => alert('Đặt hàng'),
    },
  },
};
