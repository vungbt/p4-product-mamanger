import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountdownTimer } from './index';

const meta = {
  title: 'Components/CountdownTimer',
  component: CountdownTimer,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    date: { control: { type: 'date' } },
    className: { control: 'text' },
  },
} satisfies Meta<typeof CountdownTimer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    return <CountdownTimer {...args} />;
  },
  args: {
    label: 'Countdown Timer',
    date: '03:01:2025',
  },
};
