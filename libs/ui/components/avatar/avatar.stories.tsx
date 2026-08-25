import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './index';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
  },
  args: {
    name: 'Nguyen Van A',
    size: 'md',
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithImage: Story = {
  args: {
    name: 'Nguyen Van A',
    src: 'https://i.pravatar.cc/150?img=12',
  },
};

export const BrokenImageFallsBackToInitials: Story = {
  args: {
    name: 'Tran Thi B',
    src: 'https://broken-url.invalid/avatar.png',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Avatar name="P4 Manager" size={size} />
          <span className="text-12 text-neutral-text-secondary">{size}</span>
        </div>
      ))}
    </div>
  ),
};
