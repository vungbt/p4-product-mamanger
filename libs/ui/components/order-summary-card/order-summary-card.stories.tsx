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
    subtotal: '1.980.000đ',
    discount: '198.000đ',
    shipping: '30.000đ',
    total: '1.812.000đ',
    ctaLabel: 'Đặt hàng',
  },
};
