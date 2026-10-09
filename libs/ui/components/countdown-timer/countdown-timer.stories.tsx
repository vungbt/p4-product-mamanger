import type { Meta, StoryObj } from '@storybook/react-vite';
import CountdownTimer from './index';

const meta: Meta<typeof CountdownTimer> = {
  title: 'Components/CountdownTimer',
  component: CountdownTimer,
  args: {
    targetDate: new Date(),
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
    targetDate: new Date('2026-10-10 09:43:00'),
    title: 'Flash sale kết thúc sau:',
  },
};
