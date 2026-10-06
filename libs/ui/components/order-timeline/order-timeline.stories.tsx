import type { Meta, StoryObj } from '@storybook/react-vite';
import { OrderTimeline } from './index';

const meta: Meta<typeof OrderTimeline> = {
  title: 'OrderTimeline',
  component: OrderTimeline,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    steps: [
      {
        label: 'Đã lên đơn',
        done: true,
        current: true,
        date: new Date(),
      },
      {
        label: 'Thanh toán.',
        done: true,
        current: true,
        description: 'VNPay',
        date: new Date(),
      },
      {
        label: 'đáng gói',
        done: false,
        current: true,
        date: new Date(),
      },
      {
        label: 'hoàn tất',
        done: false,
        current: true,
        date: new Date(),
      },
    ],
  },
};
