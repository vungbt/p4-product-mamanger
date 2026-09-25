import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatCard } from './index';

const meta: Meta<typeof StatCard> = {
  title: 'Components/StatCard',
  component: StatCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  render: (args) => {
    return <StatCard {...args} />;
  },
  args: {
    value: [182450000, 382, 6],
    trend: [12.4, 12, 10],
    sub: [],
  },
};
