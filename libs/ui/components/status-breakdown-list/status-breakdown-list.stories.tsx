import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBreakdownList } from './index';

const meta: Meta<typeof StatusBreakdownList> = {
  title: 'Components/StatusBreakdownList',
  component: StatusBreakdownList,
};
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: {
    rows: [
      { label: 'Hoàn tất', count: 123, percent: 100, color: 'success' },
      { label: 'Đang giao', count: 56, percent: 35, color: 'primary' },
      { label: 'Đã thanh toán', count: 29, percent: 25, color: 'info' },
      { label: 'Chờ xử lý', count: 19, percent: 15, color: 'pending' },
      { label: 'Đã hủy', count: 12, percent: 5, color: 'error' },
    ],
  },
};
