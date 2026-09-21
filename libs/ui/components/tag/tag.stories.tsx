import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TAG_COLORS, Tag, type TagColorName } from './index';

const TAG_COLOR_NAMES = Object.keys(TAG_COLORS) as TagColorName[];

const meta = {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: TAG_COLOR_NAMES },
    type: { control: 'select', options: ['default', 'outline', 'solid'] },
  },
  args: {
    content: 'In stock',
    color: 'success',
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Neutral: Story = {
  args: { content: 'Draft', color: undefined },
};

export const WithIcon: Story = {
  args: { content: 'Trending', icon: 'graph', color: 'primary' },
};

export const Closable: Story = {
  args: { content: 'Sneakers', color: 'info', onClose: fn() },
};

export const Sold: Story = {
  args: { content: 'Sold', color: undefined, type: 'solid' },
};

export const Custom: Story = {
  args: { content: 'Draft', color: '#94a3b8' },
  argTypes: {
    color: { control: 'color' },
  },
};

export const AllDesignColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {TAG_COLOR_NAMES.map((name) => (
        <Tag key={name} content={name} color={name} />
      ))}
    </div>
  ),
};
