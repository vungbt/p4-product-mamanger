import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Input } from './index';

const COLORS = ['primary', 'secondary', 'success', 'error', 'pending', 'neutral'] as const;
const VARIANTS = ['solid', 'outline', 'subtle', 'ghost'] as const;

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: COLORS },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: ['small', 'middle', 'large'] },
  },
  args: {
    placeholder: 'Search products...',
    color: 'neutral',
    variant: 'outline',
    size: 'middle',
    onChange: fn(),
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithLabel: Story = {
  args: { label: 'Email', required: true, icon: 'envelope', placeholder: 'you@example.com' },
};

export const WithHelperText: Story = {
  args: { label: 'Coupon code', helperText: 'Case-insensitive, e.g. SALE10' },
};

export const WithError: Story = {
  args: { label: 'Email', error: 'This email is already in use', icon: 'envelope' },
};

export const Loading: Story = {
  args: { loading: true, placeholder: 'Loading...' },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled' },
};

export const AllColors: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      {COLORS.map((color) => (
        <Input key={color} color={color} placeholder={color} />
      ))}
    </div>
  ),
};
