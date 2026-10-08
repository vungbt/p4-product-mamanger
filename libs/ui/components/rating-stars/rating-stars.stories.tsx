import type { Meta, StoryObj } from '@storybook/react-vite';
import { RatingStars } from '.';

export default {
  title: 'Components/RatingStars',
  component: RatingStars,
  tags: ['autodocs'],
} as Meta<typeof RatingStars>;

type Story = StoryObj<typeof RatingStars>;

export const Default: Story = {
  render: (args) => (
    <div>
      <RatingStars {...args} />
    </div>
  ),
  args: {
    orientation: 'readonly',
    rating: 5,
    maxRating: 5,
    count: 218,
    label: 'đã bán',
  },
};

export const WithEvaluate: Story = {
  render: (args) => (
    <div>
      <RatingStars {...args} />
    </div>
  ),
  args: {
    orientation: 'readonly',
    rating: 4.6,
    maxRating: 5,
    count: 180,
    label: 'đánh giá',
  },
};

export const Large: Story = {
  render: (args) => (
    <div>
      <RatingStars {...args} />
    </div>
  ),
  args: {
    orientation: 'readonly',
    rating: 3,
    maxRating: 5,
    count: 0,
    label: 'đã bán',
  },
};

export const Clickable: Story = {
  render: (args) => (
    <div>
      <RatingStars {...args} className="text-24" />
    </div>
  ),
  args: {
    orientation: 'clickable',
    rating: 4,
    maxRating: 5,
    count: 200,
    label: 'sao',
  },
};
