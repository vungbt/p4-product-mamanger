import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarUpload } from './index';

const meta = {
  title: 'Components/AvatarUpload',
  component: AvatarUpload,
  tags: ['autodocs'],
} satisfies Meta<typeof AvatarUpload>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    src: '',
    initials: 'Đông Sứa',
    size: 'md',
    accept: 'đổi ảnh đại diện',
    onUpload: (file) => console.log(file),
  },
};

export const Large: Story = {
  args: {
    src: '',
    initials: 'Ngọc Lan',
    size: 'lg',
    accept: 'Đổi ảnh đại diện',
    label: 'PNG/JPG, tối đa 2MB',
    onUpload: (file) => console.log(file),
  },
};
