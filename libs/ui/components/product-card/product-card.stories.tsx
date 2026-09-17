import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductCart } from '.';

const meta = {
  title: 'Components/ProductCard',
  component: ProductCart,
  tags: ['autodocs'],
  argTypes: {
    stock: { control: 'number' },
    sold: { control: 'number' },
    rating: { control: 'number' },
    price: { control: 'number' },
  },
} satisfies Meta<typeof ProductCart>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: (args) => <ProductCart {...args} />,
  args: {
    favorited: false,
    type: 'best-seller',
    imageUrl: '',
    category: 'Phụ Kiện',
    stock: 50,
    sold: 150,
    name: 'DareU EK128 Pro wired red switch',
    description: 'Bàn phím cơ Gaming DareU EK128 Pro wired red switch, ',
    rating: 4.8,
    price: 1043500,
  },
};

export const UndefinedType: Story = {
  render: (args) => <ProductCart {...args} />,
  args: {
    favorited: false,
    type: undefined,
    imageUrl: '',
    category: 'Phụ Kiện',
    stock: 50,
    sold: 150,
    name: 'DareU EK128 Pro wired red switch',
    description: '',
    rating: 4.8,
    price: 1043500,
  },
};

export const NewArival: Story = {
  render: (args) => <ProductCart {...args} />,
  args: {
    favorited: false,
    type: 'new-arrival',
    imageUrl: '',
    category: 'Phụ Kiện',
    stock: 50,
    sold: 150,
    name: 'DareU EK128 Pro wired red switch',
    description:
      'Bàn phím cơ Gaming DareU EK128 Pro wired red switch,sản phẩm mới đầy đủ tính năng với 3 cổng kết nối',
    rating: 4.8,
    price: 1043500,
  },
};
