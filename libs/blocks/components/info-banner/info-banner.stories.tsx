import type { Meta, StoryObj } from '@storybook/react-vite';
import { InfoBanner } from './index';

const meta: Meta<typeof InfoBanner> = {
  title: 'Components/InfoBanner',
  component: InfoBanner,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof InfoBanner>;

export const Default: Story = {
  render: (args) => (
    <div className="">
      <InfoBanner {...args} />
    </div>
  ),
  args: {
    tone: 'info',
    message:
      'Danh sách chỉ đọc- hoàn tiền được khởi tạo từ cổng thanh toán,không sửa trong Admin. ',
  },
};

export const withSuccessBanner: Story = {
  render: (args) => (
    <div className="">
      <InfoBanner {...args} />
    </div>
  ),
  args: {
    tone: 'success',
    message: 'Danh sách chỉ đọc-hoàn tiền được khởi tạo từ cổng thanh toán,không sửa trong Admin.',
  },
};

export const withErrorBanner: Story = {
  render: (args) => (
    <div className="">
      <InfoBanner {...args} />
    </div>
  ),
  args: {
    tone: 'error',
    message: 'Danh sách chỉ đọc-hoàn tiền được khởi tạo từ cổng thanh toán,không sửa trong Admin.',
  },
};

export const withPendingBanner: Story = {
  render: (args) => (
    <div className="">
      <InfoBanner {...args} />
    </div>
  ),
  args: {
    tone: 'pending',
    message: 'Danh sách chỉ đọc-hoàn tiền được khởi tạo từ cổng thanh toán,không sửa trong Admin. ',
  },
};

export const AllInfoBanner: Story = {
  render: (args) => (
    <div className="space-y-4">
      <InfoBanner {...args} tone="info" />
      <InfoBanner {...args} tone="success" />
      <InfoBanner {...args} tone="error" />
      <InfoBanner {...args} tone="pending" />
    </div>
  ),
  args: {
    message: 'Danh sách chỉ đọc-hoàn tiền được khởi tạo từ cổng thanh toán,không sửa trong Admin.',
  },
};
