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
    onAddCart: () => alert('Thêm giỏ hàng'),
    onBuy: () => alert('Mua ngay'),
  },
};
export const Checkout: Story = {
  args: {
    showCheckout: true,
    checkoutPrice: 1000000,
    onCheckout: () => alert('Đặt hàng'),
  },
};
