import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductCard } from '.';

const meta = {
  title: 'Components/ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
  argTypes: {
    stock: { control: 'number' },
    sold: {
      control: 'object',
      properties: {
        number: { control: 'number' },
        remaining: { control: 'number' },
      },
    },
    rating: { control: 'number' },
    price: { control: 'number' },
  },
} satisfies Meta<typeof ProductCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: (args: any) => <ProductCard {...args} />,
  args: {
    favored: false,
    type: 'best-seller',
    thumbnail: {
      imageUrl: '',
      alt: '',
    },
    category: 'Phụ Kiện',
    stock: 50,
    sold: { number: 200, remaining: 10 },
    name: 'DareU EK128 Pro wired red switch',
    description: 'Bàn phím cơ Gaming DareU EK128 Pro wired red switch, ',
    rating: 4.8,
    price: 1043500,
  },
};

export const UndefinedType: Story = {
  render: (args: any) => <ProductCard {...args} />,
  args: {
    favored: false,
    type: undefined,
    thumbnail: {
      imageUrl: '',
      alt: '',
    },
    category: 'Phụ Kiện',
    stock: 50,
    sold: {},
    name: 'DareU EK128 Pro wired red switch',
    description: '',
    rating: 4.8,
    price: 1043500,
  },
};

export const NewArival: Story = {
  render: (args: any) => <ProductCard {...args} />,
  args: {
    favored: false,
    type: 'new-arrival',
    thumbnail: {
      imageUrl: '',
      alt: '',
    },
    category: 'Phụ Kiện',
    stock: 50,
    sold: { number: 200, remaining: 30 },
    name: 'DareU EK128 Pro wired red switch',
    description:
      'Bàn phím cơ Gaming DareU EK128 Pro wired red switch,sản phẩm mới đầy đủ tính năng với 3 cổng kết nối',
    rating: 4.8,
    price: 1043500,
  },
};
