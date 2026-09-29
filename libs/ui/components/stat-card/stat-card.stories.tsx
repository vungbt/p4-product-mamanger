import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatCard } from './index';

const meta: Meta<typeof StatCard> = {
  title: 'Components/StatCard',
  component: StatCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  render: () => {
    return (
      <div className="grid grid-cols-3 gap-4 bg-neutral-white p-6 rounded-xl">
        <StatCard
          label="Doanh thu"
          value="182450000"
          trend={132}
          sub="so với kỳ trước"
          tone="primary"
        />
      </div>
    );
  },
};

export const withOrder: Story = {
  render: () => {
    return (
      <div className="grid grid-cols-3 gap-4 bg-neutral-white p-6 rounded-xl">
        <StatCard label="Số đơn hàng" value="348" trend={12} sub="chờ xử lý" tone="default" />
      </div>
    );
  },
};

export const withLowStock: Story = {
  render: () => {
    return (
      <div className="grid grid-cols-3 gap-4 bg-neutral-white p-6 rounded-xl">
        <StatCard
          label="Sản phẩm sắp hết"
          value="6"
          trend={10}
          sub="Ngưỡng cảnh báo: tồn ≤"
          tone="pending"
        />
      </div>
    );
  },
};

export const AllCards: Story = {
  render: () => {
    return (
      <div className="grid grid-cols-3 gap-4 bg-neutral-white p-6 rounded-xl">
        <StatCard
          label="Doanh thu"
          value="182450000"
          trend={132}
          sub="so với kỳ trước"
          tone="primary"
        />
        <StatCard label="Số đơn hàng" value="348" trend={12} sub="chờ xử lý" tone="default" />
        <StatCard
          label="Sản phẩm sắp hết"
          value="6"
          trend={10}
          sub="Ngưỡng cảnh báo: tồn ≤"
          tone="pending"
        />
      </div>
    );
  },
};
