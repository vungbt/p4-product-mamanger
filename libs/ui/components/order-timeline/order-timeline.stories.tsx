import type { Meta, StoryObj } from '@storybook/react-vite';
import { OrderTimeline } from './index';

const meta: Meta<typeof OrderTimeline> = {
  title: 'OrderTimeline',
  component: OrderTimeline,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: (args) => {
    return (
      <div className="">
        <OrderTimeline {...args} />
      </div>
    );
  },
  args: {
    orientation: 'vertical',
    steps: [
      {
        label: 'Đã tạo đơn',
        done: true,
        current: true,
        date: new Date(),
      },
      {
        label: 'Thanh toán thành công.',
        done: true,
        current: true,
        description: 'VNPay',
        date: new Date('10/08 15:48'),
      },
      {
        label: 'Đã đóng gói tại kho HCM',
        done: true,
        current: true,
        date: new Date('10/09 16:48:34'),
      },
      {
        label: 'Đang giao hàng.',
        done: false,
        current: true,
        description: 'GHTK',
        date: new Date('10/10 17:48:34'),
      },
      {
        label: 'Hoàn tất',
        done: false,
        current: false,
        date: new Date('10/12 18:48:34'),
      },
    ],
  },
};

export const Horizontal: Story = {
  render: (args) => {
    return (
      <div className="">
        <OrderTimeline {...args} />
      </div>
    );
  },
  args: {
    orientation: 'horizontal',
    steps: [
      {
        label: 'Đã đặt',
        done: true,
        current: true,
        date: new Date(),
      },
      {
        label: 'Đã thanh toán',
        done: true,
        current: true,
        date: new Date(),
      },
      {
        label: 'Đã đóng gói',
        done: true,
        current: true,
        date: new Date(),
      },
      {
        label: 'Đang giao.',
        done: false,
        current: true,
        date: new Date(),
      },
      {
        label: 'Hoàn tất',
        done: false,
        current: false,
        date: new Date(),
      },
    ],
  },
};
