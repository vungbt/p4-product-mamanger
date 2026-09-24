import type { Meta, StoryObj } from '@storybook/react-vite';
import { OrderSummaryCard } from './index';

const meta: Meta<typeof OrderSummaryCard> = {
  title: 'Components/OrderSummaryCard',
  component: OrderSummaryCard,
  argTypes: {
    onSubmit: {
      action: 'submitted',
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-96">
      <OrderSummaryCard {...args} />
    </div>
  ),
  args: {
    onSubmit: () => {},
    items: [
      { label: 'Tạm tính', value: 1980000 },
      { label: 'Giảm giá (SALE10)', value: 198000, highlight: true },
      { label: 'Phí vận chuyển', value: 30000 },
    ],
    total: { value: 1812000, label: '1812000' },
    ctaLabel: 'Đặt hàng',
  },
};

export const WithoutDiscount: Story = {
  render: (args) => (
    <div className="w-96">
      <OrderSummaryCard {...args} />
    </div>
  ),
  args: {
    onSubmit: () => {},
    items: [
      { label: 'Tạm tính', value: 1980000 },
      { label: 'Giảm giá', value: 198000, highlight: true },
      { label: 'Phí vận chuyển', value: 'Miễn phí vận chuyển' },
    ],
    total: { value: 1812000, label: '1.812.000đ' },
    ctaLabel: 'Đặt hàng',
  },
};
