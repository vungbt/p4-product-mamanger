import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Tag } from './index';

const DESIGN_COLORS = [
  { name: 'success', hex: '#22c55e' },
  { name: 'pending', hex: '#eab308' },
  { name: 'error', hex: '#ef4444' },
  { name: 'info', hex: '#0ea5e9' },
  { name: 'primary', hex: '#f97316' },
];

const meta = {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
  args: {
    content: 'In stock',
    color: '#22c55e',
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Neutral: Story = {
  args: { content: 'Draft', color: undefined },
};

export const WithIcon: Story = {
  args: { content: 'Trending', icon: 'graph', color: '#f97316' },
};

export const Closable: Story = {
  args: { content: 'Sneakers', color: '#0ea5e9', onClose: fn() },
};
export const AllDesignColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {DESIGN_COLORS.map(({ name, hex }) => (
        <Tag key={name} content={name} color={hex} />
      ))}
    </div>
  ),
};
