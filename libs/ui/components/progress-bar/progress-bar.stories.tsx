import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from '.';

const meta = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  argTypes: {
    currentValue: {
      control: 'number',
    },
    total: {
      control: 'number',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-60">
      <ProgressBar {...args} />
    </div>
  ),
  args: {
    currentValue: 50,
    total: 100,
  },
};

export const WithEmpty: Story = {
  render: (args) => (
    <div className="w-60">
      <ProgressBar {...args} />
    </div>
  ),
  args: {
    currentValue: 0,
    total: 100,
  },
};

export const WithFull: Story = {
  render: (args) => (
    <div className="w-60">
      <ProgressBar {...args} />
    </div>
  ),
  args: {
    currentValue: 100,
    total: 100,
  },
};
