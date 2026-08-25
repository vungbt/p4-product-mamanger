import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from './index';

const COLORS = ['primary', 'secondary', 'success', 'error', 'pending', 'neutral'] as const;
const VARIANTS = ['solid', 'outline', 'subtle', 'link', 'text', 'ghost'] as const;
const SIZES = ['small', 'middle', 'large'] as const;

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: COLORS },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
    shape: { control: 'select', options: ['default', 'circle', 'round'] },
    icon: { control: 'text' },
    iconRight: { control: 'text' },
  },
  args: {
    children: 'Button',
    color: 'primary',
    variant: 'solid',
    size: 'middle',
    shape: 'default',
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithIcon: Story = {
  args: { icon: 'add', children: 'Add product' },
};

export const Loading: Story = {
  args: { loading: true, children: 'Saving...' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

export const AllVariantsByColor: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {COLORS.map((color) => (
        <div key={color} className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-12 capitalize text-neutral-text-secondary">
            {color}
          </span>
          {VARIANTS.map((variant) => (
            <Button key={variant} color={color} variant={variant} size="small">
              {variant}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {SIZES.map((size) => (
        <Button key={size} size={size} icon="add">
          {size}
        </Button>
      ))}
    </div>
  ),
};
