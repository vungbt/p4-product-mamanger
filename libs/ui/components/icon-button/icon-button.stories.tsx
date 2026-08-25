import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { IconButton } from './index';

const COLORS = ['primary', 'secondary', 'success', 'error', 'pending', 'neutral'] as const;
const VARIANTS = ['solid', 'outline', 'subtle', 'ghost', 'text', 'default'] as const;

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: COLORS },
    variant: { control: 'select', options: VARIANTS },
    icon: { control: 'text' },
  },
  args: {
    icon: 'pencil',
    color: 'primary',
    variant: 'ghost',
    onClick: fn(),
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllVariantsByColor: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {COLORS.map((color) => (
        <div key={color} className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-12 capitalize text-neutral-text-secondary">
            {color}
          </span>
          {VARIANTS.map((variant) => (
            <IconButton key={variant} icon="trash" color={color} variant={variant} />
          ))}
        </div>
      ))}
    </div>
  ),
};

// Per docs/design/p4-product-manager-design.html (Section A · Button): action icon-buttons in a
// table row (Edit/Delete) are an 8px-rounded square with a border — use `shape="square"`.
export const RowActions: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <IconButton icon="pencil" shape="square" variant="outline" color="neutral" />
      <IconButton icon="trash" shape="square" variant="subtle" color="error" />
    </div>
  ),
};

// Per docs/design/p4-product-manager-design.html (Section A · Button): an icon-button can attach
// a count badge in the top-right corner (e.g. a notification bell with unread messages).
export const WithBadge: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton icon="bell" shape="square" variant="outline" color="neutral" badge={3} />
      <IconButton icon="bell" shape="circle" variant="ghost" color="neutral" badge={99} />
      <IconButton
        icon="bell"
        shape="circle"
        variant="ghost"
        color="neutral"
        badge="•"
        badgeColor="error"
      />
    </div>
  ),
};
