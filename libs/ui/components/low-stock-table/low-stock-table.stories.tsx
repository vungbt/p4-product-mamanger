import type { Meta, StoryObj } from '@storybook/react-vite';
import { type LowStockProduct, LowStockTable } from '.';

const PRODUCTS: LowStockProduct[] = [
  {
    id: '1',
    name: 'Bàn phím cơ AULA SF2099 RGB Mechanical Keyboard',
    stock: 4,
    image: {
      url: 'https://philong.com.vn/media/lib/04-03-2024/ban-phim-co-khong-day-edra-ek398l-philong2.jpg',
    },
  },
  {
    id: '2',
    name: 'Chuột không dây Logitech MX Master 3S',
    stock: 0,
  },
  {
    id: '3',
    name: 'Tai nghe Sony WH-1000XM5',
    stock: 9,
  },
];

const meta = {
  title: 'Components/LowStockTable',
  component: LowStockTable,
  tags: ['autodocs'],
} satisfies Meta<typeof LowStockTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    products: PRODUCTS,
  },
};

export const Loading: Story = {
  args: {
    products: PRODUCTS,
    loading: true,
  },
};

export const NoLowStockProducts: Story = {
  args: {
    products: [],
  },
};
