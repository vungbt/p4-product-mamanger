import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReviewCard } from './index';

const meta = {
  title: 'Components/ReviewCard',
  component: ReviewCard,
  tags: ['autodocs'],
  argTypes: {
    userEmail: { control: 'text' },
    rating: { control: 'number' },
    date: { control: 'date' },
    comment: { control: 'text' },
  },
} satisfies Meta<typeof ReviewCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="max-w-2xl w-full flex gap-2 items-center">
      <ReviewCard {...args} />
    </div>
  ),
  args: {
    userEmail: 'dongbui942006@gmail.com',
    rating: 5,
    maxRating: 5,
    date: new Date('2026-10-11'),
    comment: 'Đáng giá trong tầm giá, phần mềm tuỳ biến hơi khó dùng.',
  },
};

export const Defaultttt: Story = {
  render: (args) => (
    <div className="max-w-2xl w-full flex gap-2 items-center">
      <ReviewCard {...args} />
    </div>
  ),
  args: {
    userEmail: 'dongbui942006@gmail.com',
    rating: 4,
    date: new Date(),
    comment: 'Đáng giá trong tầm giá, phần mềm tuỳ biến hơi khó dùng.',
  },
};
