import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryCard, type CategoryCardProps } from './index';

const meta: Meta<CategoryCardProps> = {
  title: 'Components/CategoryCard',
  component: CategoryCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    image: {
      url: '',
      alt: '',
    },
    name: 'Phụ kiện',
    count: 10,
    label: 'sản phẩm',
  },
  render: (args) => {
    return <CategoryCard {...args} className="w-52" />;
  },
};

export const WithImage: Story = {
  args: {
    image: {
      url: 'https://demoda.vn/wp-content/uploads/2022/11/hinh-anh-zoro.jpg',
      alt: 'Phụ kiện',
    },
    name: 'Phụ kiện',
    count: 0,
    label: 'sản phẩm',
  },
  render: (args) => {
    return <CategoryCard {...args} className="w-64" />;
  },
};
