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
  render: (args: any) => (
    <div className="inline-flex">
      <ProductCard {...args} />
    </div>
  ),
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
  render: (args: any) => (
    <div className="grid grid-cols-3 gap-4">
      <ProductCard {...args} type="best-seller" />
      <ProductCard {...args} type="featured" />
      <ProductCard {...args} type="new-arrival" />
      <ProductCard
        {...args}
        type={undefined}
        stock={0}
        description="Bàn phím cơ Gaming DareU EK128 Pro wired red switch"
      />
    </div>
  ),
};

export const NewArival: Story = {
  render: (args: any) => (
    <div className="inline-flex gap-4">
      <ProductCard {...args} />
      <ProductCard {...args} />
    </div>
  ),
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
