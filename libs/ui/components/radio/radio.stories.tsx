import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from './index';

const COLORS = ['primary', 'secondary', 'success', 'error', 'pending', 'neutral'] as const;

const meta = {
  title: 'Components/Radio',
  component: Radio,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: COLORS },
    size: { control: 'select', options: ['small', 'middle', 'large'] },
  },
  args: {
    label: 'Option A',
    color: 'primary',
    size: 'middle',
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { checked: true },
};

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {COLORS.map((color) => (
        <Radio key={color} label={color} color={color} checked readOnly />
      ))}
    </div>
  ),
};
