import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from './index';

const meta: Meta<typeof Timeline> = {
  title: 'Components/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['vertical', 'horizontal'] },
    dotSize: { control: 'select', options: [12, 16] },
    iconSize: { control: 'number' },
  },
  args: {
    variant: 'vertical',
    dotSize: 12,
    iconSize: 20,
  },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  args: {
    steps: [
      { label: 'Đã tạo đơn', done: true },
      { label: 'Thanh toán thành công · VNPay', done: true },
      { label: 'Đã đóng gói tại kho HCM', done: true },
      { label: 'Đang vận chuyển · GHTK', current: true },
      { label: 'Giao thành công' },
    ],
    variant: 'vertical',
  },
};

export const Horizontal: Story = {
  args: {
    steps: [
      { label: 'Đã đặt', done: true },
      { label: 'Đã đóng gói', done: true },
      { label: 'Đang giao', current: true },
      { label: 'Hoàn tất' },
    ],
    variant: 'horizontal',
  },
};

export const VerticalIcon: Story = {
  args: {
    steps: [
      { label: 'Đã tạo đơn', subtitle: '18/08 09:24', done: true, icon: 'check-circle' },
      { label: 'Thanh toán thành công', subtitle: '18/08 09:26', done: true, icon: 'shield-check' },
      { label: 'Đã đóng gói', subtitle: '18/08 14:10', done: true, icon: 'shopping-cart' },
      { label: 'Đang vận chuyển', subtitle: '19/08 07:40', current: true, icon: 'arrow-right' },
      { label: 'Giao thành công', subtitle: 'dự kiến 20/08', icon: 'home-solid' },
    ],
    variant: 'vertical',
  },
};

export const HorizontalIcon: Story = {
  args: {
    steps: [
      { label: 'Đặt hàng', subtitle: '18/08 09:24', done: true, icon: 'shopping-cart' },
      { label: 'Thanh toán', subtitle: '18/08 09:26', done: true, icon: 'shield-check' },
      { label: 'Đang giao', subtitle: '19/08 07:40', current: true, icon: 'arrow-right' },
      { label: 'Hoàn tất', subtitle: 'dự kiến 20/08', icon: 'home-solid' },
    ],
    variant: 'horizontal',
  },
};

export const VerticalIconCustomSize: Story = {
  args: {
    steps: [
      { label: 'Đã tạo đơn', subtitle: '18/08 09:24', done: true, icon: 'check-circle' },
      { label: 'Thanh toán thành công', subtitle: '18/08 09:26', done: true, icon: 'shield-check' },
      { label: 'Đã đóng gói', subtitle: '18/08 14:10', done: true, icon: 'shopping-cart' },
      { label: 'Đang vận chuyển', subtitle: '19/08 07:40', current: true, icon: 'arrow-right' },
      { label: 'Giao thành công', subtitle: 'dự kiến 20/08', icon: 'home-solid' },
    ],
    variant: 'vertical',
    iconSize: 26,
  },
};

export const HorizontalIconCustomSize: Story = {
  args: {
    steps: [
      { label: 'Đặt hàng', subtitle: '18/08 09:24', done: true, icon: 'shopping-cart' },
      { label: 'Thanh toán', subtitle: '18/08 09:26', done: true, icon: 'shield-check' },
      { label: 'Đang giao', subtitle: '19/08 07:40', current: true, icon: 'arrow-right' },
      { label: 'Hoàn tất', subtitle: 'dự kiến 20/08', icon: 'home-solid' },
    ],
    variant: 'horizontal',
    iconSize: 26,
  },
};

export const VerticalDot12: Story = {
  args: {
    steps: [
      { label: 'Đã tạo đơn', subtitle: '18/08 09:24', done: true },
      { label: 'Thanh toán thành công', subtitle: '18/08 09:26', done: true },
      { label: 'Đang vận chuyển', subtitle: '19/08 07:40', current: true },
      { label: 'Giao thành công', subtitle: 'dự kiến 20/08' },
    ],
    variant: 'vertical',
    dotSize: 12,
  },
};

export const HorizontalDot12: Story = {
  args: {
    steps: [
      { label: 'Đã đặt', subtitle: '18/08 09:24', done: true },
      { label: 'Đã đóng gói', subtitle: '18/08 14:10', done: true },
      { label: 'Đang giao', subtitle: '19/08 07:40', current: true },
      { label: 'Hoàn tất', subtitle: 'dự kiến 20/08' },
    ],
    variant: 'horizontal',
    dotSize: 12,
  },
};

export const VerticalDot16: Story = {
  args: {
    steps: [
      { label: 'Đã tạo đơn', subtitle: '18/08 09:24', done: true },
      { label: 'Thanh toán thành công', subtitle: '18/08 09:26', done: true },
      { label: 'Đang vận chuyển', subtitle: '19/08 07:40', current: true },
      { label: 'Giao thành công', subtitle: 'dự kiến 20/08' },
    ],
    variant: 'vertical',
    dotSize: 16,
  },
};

export const HorizontalDot16: Story = {
  args: {
    steps: [
      { label: 'Đã đặt', subtitle: '18/08 09:24', done: true },
      { label: 'Đã đóng gói', subtitle: '18/08 14:10', done: true },
      { label: 'Đang giao', subtitle: '19/08 07:40', current: true },
      { label: 'Hoàn tất', subtitle: 'dự kiến 20/08' },
    ],
    variant: 'horizontal',
    dotSize: 16,
  },
};
