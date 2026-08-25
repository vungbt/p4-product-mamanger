import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './index';

const meta = {
  title: 'Components/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-80">
      <p className="text-14 text-neutral-text-secondary">Above</p>
      <Divider className="my-3" />
      <p className="text-14 text-neutral-text-secondary">Below</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-10 items-center gap-3">
      <span className="text-14">Left</span>
      <Divider orientation="vertical" />
      <span className="text-14">Right</span>
    </div>
  ),
};
