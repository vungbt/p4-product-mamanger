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
      { label: 'Hoàn tất', count: 123, percent: 100, type: 'đơn', color: 'success' },
      { label: 'Hoàn tất', count: 56, percent: 35, type: 'đơn', color: 'success' },
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
      { label: 'Đang giao', count: 123, percent: 100, type: 'đơn', color: 'primary' },
      { label: 'Đang giao', count: 56, percent: 35, type: 'đơn', color: 'primary' },
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
      { label: 'Đã thanh toán', count: 123, percent: 100, type: 'đơn', color: 'info' },
      { label: 'Đã thanh toán', count: 29, percent: 25, type: 'đơn', color: 'info' },
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
      { label: 'Chờ xử lý', count: 19, percent: 15, type: 'đơn', color: 'pending' },
      { label: 'Chờ xử lý', count: 12, percent: 5, type: 'đơn', color: 'pending' },
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
      { label: 'Hoàn tất', count: 123, percent: 100, type: 'đơn', color: 'error' },
      { label: 'Hoàn tất', count: 56, percent: 35, type: 'đơn', color: 'error' },
    ],
  },
};

export const AllStatus: Story = {
  render: (args) => (
    <div className="w-1/2">
      <StatusBreakdownList {...args} />
    </div>
  ),
  args: {
    rows: [
      { label: 'Hoàn tất', count: 123, percent: 100, type: 'đơn', color: 'success' },
      { label: 'Đang giao', count: 56, percent: 35, type: 'đơn', color: 'primary' },
      { label: 'Đã thanh toán', count: 29, percent: 25, type: 'đơn', color: 'info' },
      { label: 'Chờ xử lý', count: 19, percent: 15, type: 'đơn', color: 'pending' },
      { label: 'Đã hủy', count: 12, percent: 5, type: 'đơn', color: 'error' },
    ],
  },
};
