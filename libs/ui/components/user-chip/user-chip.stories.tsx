import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserChip } from './index';

const meta = {
  title: 'Components/UserChip',
  component: UserChip,
  tags: ['autodocs'],
  args: {
    name: 'Ngọc Lan',
  },
} satisfies Meta<typeof UserChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAvatarImage: Story = {
  args: {
    name: 'Minh Tuấn',
    avatarUrl: 'https://i.pravatar.cc/56?img=12',
  },
};

export const WithDropdown: Story = {
  args: {
    dropdownItems: [
      { key: 'profile', label: 'Xem hồ sơ' },
      { key: 'switch', label: 'Đổi người xử lý' },
      { key: 'remove', label: 'Bỏ gán', danger: true },
    ],
  },
};
