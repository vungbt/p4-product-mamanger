import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryCard, type CategoryCardProps } from './index';

const meta: Meta<CategoryCardProps> = {
  title: 'Components/CategoryCard',
  component: CategoryCard,
  tags: ['autodocs'],
  args: {
    category: {
      image: '',
      name: 'Category',
      count: 10,
    },
  },
  decorators: [
    (Story) => (
      <div className="inline-flex">
        <Story />
      </div>
    ),
  ],
};

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    return <CategoryCard {...args} className="" />;
  },
};

export default meta;
