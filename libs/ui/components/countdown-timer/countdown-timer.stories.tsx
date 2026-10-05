import type { Meta, StoryObj } from '@storybook/react-vite';
import CountdownTimer from './index';

const meta: Meta<typeof CountdownTimer> = {
  title: 'Components/CountdownTimer',
  component: CountdownTimer,
  args: {
    targetDate: '',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-96">
      <CountdownTimer {...args} />
    </div>
  ),
  args: {
    targetDate: '2026-10-31',
    title: 'Flash sale kết thúc sau:',
  },
};

export const WithHours: Story = {
  render: (args) => (
    <div className="w-96">
      <CountdownTimer {...args} />
    </div>
  ),
  args: {
    targetDate: '2026-10-06',
    title: 'Flash sale kết thúc sau:',
  },
};

export const WithMinutes: Story = {
  render: (args) => (
    <div className="w-96">
      <CountdownTimer {...args} />
    </div>
  ),
  args: {
    targetDate: '2026-10-05T05:00:59.000Z',
    title: 'Flash sale kết thúc sau:',
  },
};

export const WithSeconds: Story = {
  render: (args) => (
    <div className="w-96">
      <CountdownTimer {...args} />
    </div>
  ),
  args: {
    targetDate: '2026-10-05T04:21:59.000Z',
    title: 'Flash sale kết thúc sau:',
  },
};
