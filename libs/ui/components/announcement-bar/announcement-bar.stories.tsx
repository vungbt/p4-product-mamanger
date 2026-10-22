import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnnouncementBar } from './index';

const meta: Meta<typeof AnnouncementBar> = {
  title: 'Components/AnnouncementBar',
  component: AnnouncementBar,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AnnouncementBar>;

export const Default: Story = {
  args: {
    label: 'Miễn phí vận chuyển cho đơn hàng từ 500.000đ',
    highlighted: {
      description: 'Nhập mã',
      code: 'FREESHIP',
    },
  },
};
