import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Checkbox } from './index';

const COLORS = ['primary', 'secondary', 'success', 'error', 'pending', 'neutral'] as const;

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: COLORS },
    size: { control: 'select', options: ['small', 'middle', 'large'] },
  },
  args: {
    label: 'Remember me',
    color: 'primary',
    size: 'middle',
    onChange: fn(),
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { checked: true },
};

export const Indeterminate: Story = {
  args: { indeterminate: true },
};

export const WithError: Story = {
  args: { error: 'You must accept the terms' },
};

export const Disabled: Story = {
  args: { disabled: true, checked: true },
};

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {COLORS.map((color) => (
        <Checkbox key={color} label={color} color={color} checked readOnly />
      ))}
    </div>
  ),
};
