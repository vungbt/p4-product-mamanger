import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBreakdownList } from './index';

const meta: Meta<typeof StatusBreakdownList> = {
  title: 'Components/StatusBreakdownList',
  component: StatusBreakdownList,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const WithSuccessStatus: Story = {
  render: (args) => (
    <div className="w-1/2">
      <StatusBreakdownList {...args} />
    </div>
  ),
  args: {
    rows: [
      {
        label: 'Hoàn tất',
        order: 'đơn',
        color: 'success',
        progress: 1127,
        total: 1127,
        remaining: 117,
      },
    ],
  },
};

export const WithPrimaryStatus: Story = {
  render: (args) => (
    <div className="w-1/2">
      <StatusBreakdownList {...args} />
    </div>
  ),
  args: {
    rows: [
      {
        label: 'Đang giao',
        order: 'đơn',
        color: 'primary',
        progress: 300,
        total: 500,
        remaining: 200,
      },
    ],
  },
};

export const WithInfoStatus: Story = {
  render: (args) => (
    <div className="w-1/2">
      <StatusBreakdownList {...args} />
    </div>
  ),
  args: {
    rows: [
      {
        label: 'Đã thanh toán',
        order: 'đơn',
        color: 'info',
        progress: 400,
        total: 1000,
        remaining: 600,
      },
    ],
  },
};

export const WithPendingStatus: Story = {
  render: (args) => (
    <div className="w-1/2">
      <StatusBreakdownList {...args} />
    </div>
  ),
  args: {
    rows: [
      {
        label: 'Chờ xử lý',
        order: 'đơn',
        color: 'pending',
        progress: 500,
        total: 1000,
        remaining: 500,
      },
    ],
  },
};

export const WithErrorStatus: Story = {
  render: (args) => (
    <div className="w-1/2">
      <StatusBreakdownList {...args} />
    </div>
  ),
  args: {
    rows: [
      {
        label: 'Đã hủy',
        order: 'đơn',
        color: 'error',
        progress: 500,
        total: 1000,
        remaining: 500,
      },
    ],
  },
};
