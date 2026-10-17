import type { Meta, StoryObj } from '@storybook/react-vite';
import { RatingBreakdown } from './index';

const meta = {
  title: 'Components/RatingBreakdown',
  component: RatingBreakdown,
  tags: ['autodocs'],
} as Meta<typeof RatingBreakdown>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: (args) => (
    <div className="p-4 w-28">
      <RatingBreakdown {...args} />
    </div>
  ),
  args: {
    average: 4.6,
    total: 12,
    breakdown: [
      {
        star: 5,
        count: 8,
      },
      {
        star: 4,
        count: 3,
      },
      {
        star: 3,
        count: 1,
      },
      {
        star: 2,
        count: 0,
      },
      {
        star: 1,
        count: 0,
      },
    ],
  },
};

export const WithZeroReviews: Story = {
  render: (args) => (
    <div className="p-4 w-24">
      <RatingBreakdown {...args} />
    </div>
  ),
  args: {
    average: 0,
    total: 0,
    breakdown: [
      {
        star: 5,
        count: 0,
      },
      {
        star: 4,
        count: 0,
      },
      {
        star: 3,
        count: 0,
      },
      {
        star: 2,
        count: 0,
      },
      {
        star: 1,
        count: 0,
      },
    ],
  },
};

export const WithUndefined: Story = {
  render: (args) => (
    <div className="p-4 w-24">
      <RatingBreakdown {...args} />
    </div>
  ),
  args: {
    average: 0,
    total: undefined,
    breakdown: [
      {
        star: 5,
        count: 0,
      },
      {
        star: 4,
        count: 0,
      },
      {
        star: 3,
        count: 0,
      },
      {
        star: 2,
        count: 0,
      },
      {
        star: 1,
        count: 0,
      },
    ],
  },
};
