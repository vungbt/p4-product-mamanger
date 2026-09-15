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
  args: {
    Revenue: {
      private: 182450000,
      growth: 12.4,
    },
    Order: {
      private: 348,
      growth: 12,
    },
    Traffic: {
      private: 6,
      growth: 10,
    },
  },
};
