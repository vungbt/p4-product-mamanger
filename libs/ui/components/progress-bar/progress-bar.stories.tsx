import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from '.';

const meta = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  argTypes: {
    sold: {
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
    sold: 50,
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
    sold: 0,
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
    sold: 100,
    total: 100,
  },
};
