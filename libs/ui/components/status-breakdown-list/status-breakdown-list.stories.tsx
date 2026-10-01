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
    progress: 1127,
    total: 1127,
    remaining: 117,
    rows: [{ label: 'Hoàn tất', order: 'đơn', color: 'success' }],
  },
};

export const WithPrimaryStatus: Story = {
  render: (args) => (
    <div className="w-1/2">
      <StatusBreakdownList {...args} />
    </div>
  ),
  args: {
    progress: 1000,
    total: 1127,
    remaining: 1000,
    rows: [
      {
        label: 'Đang giao',
        order: 'đơn',
        color: 'primary',
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
    progress: 500,
    total: 1127,
    remaining: 500,
    rows: [
      {
        label: 'Đã thanh toán',
        order: 'đơn',
        color: 'info',
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
    progress: 300,
    total: 1127,
    remaining: 400,
    rows: [
      {
        label: 'Chờ xử lý',
        order: 'đơn',
        color: 'pending',
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
    progress: 123,
    total: 1127,
    remaining: 123,
    rows: [
      {
        label: 'Hoàn tất',
        order: 'đơn',
        color: 'error',
      },
    ],
  },
};
