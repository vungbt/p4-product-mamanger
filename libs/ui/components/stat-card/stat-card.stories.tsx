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
  render: () => {
    const value = [1723490, 120, 12];
    const trend = [12, 3, 3];
    return (
      <div className="">
        <StatCard
          stats={[
            {
              value: value[0],
              trend: trend[0],
              sub: [],
            },
            {
              value: value[1],
              trend: trend[1],
              sub: [],
            },
            {
              value: value[1],
              trend: trend[1],
              sub: [],
            },
          ]}
        />
      </div>
    );
  },
};

export const withNegative: Story = {
  render: () => {
    const value = [1723490, 120, 12];
    const trend = [-12, 0, 0];
    return (
      <div className="">
        <StatCard
          stats={[
            {
              value: value[0],
              trend: trend[0],
              sub: [],
            },
            {
              value: value[1],
              trend: trend[1],
              sub: [],
            },
            {
              value: value[1],
              trend: trend[1],
              sub: [],
            },
          ]}
        />
      </div>
    );
  },
};
