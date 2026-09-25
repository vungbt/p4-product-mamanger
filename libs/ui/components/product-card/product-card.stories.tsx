import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ProductCard } from '.';

const SAMPLE_IMAGE = {
  url: 'https://philong.com.vn/media/lib/04-03-2024/ban-phim-co-khong-day-edra-ek398l-philong2.jpg',
};

const atNaturalSize: Decorator = (Story) => (
  <div className="inline-flex">
    <Story />
  </div>
);

const meta: Meta<typeof ProductCard> = {
  title: 'Components/ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
  argTypes: {
    stock: { control: 'number' },
    sold: { control: 'number' },
    sale: { control: 'number' },
    price: { control: 'number' },
    originalPrice: { control: 'number' },
    rating: { control: 'number' },
    isFavorite: { control: 'boolean' },
  },
  args: {
    name: 'Bàn phím cơ Aurora 68',
    category: 'Phụ kiện',
    rating: 4.8,
    sold: 218,
    price: 1250000,
    stock: 24,
    image: SAMPLE_IMAGE,
    onAddToCart: fn(),
    onFavorite: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {
  decorators: [atNaturalSize],
  args: {
    badge: 'Bán chạy',
  },
};

export const LowStock: Story = {
  decorators: [atNaturalSize],
  args: {
    name: 'Chuột không dây Lumen M2',
    rating: 4.6,
    sold: 96,
    price: 365000,
    stock: 8,
  },
};

export const OutOfStock: Story = {
  decorators: [atNaturalSize],
  args: {
    name: 'Tai nghe Studio Air',
    category: 'Âm thanh',
    rating: 4.9,
    sold: 412,
    price: 2190000,
    stock: 0,
  },
};

export const Sale: Story = {
  decorators: [atNaturalSize],
  args: {
    name: 'Tai nghe Studio Air',
    category: 'Âm thanh',
    sale: 20,
    price: 1752000,
    originalPrice: 2190000,
    stock: 18,
  },
};

export const Favorite: Story = {
  decorators: [atNaturalSize],
  args: {
    badge: 'Bán chạy',
    isFavorite: true,
  },
};

export const LongName: Story = {
  decorators: [atNaturalSize],
  args: {
    name: 'Bàn phím cơ Aurora 68 RGB Hot-swap Bluetooth 5.1 USB-C Keycap PBT Double-shot',
  },
};

export const InGrid: Story = {
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3.5">
      <ProductCard
        name="Bàn phím cơ Aurora 68"
        category="Phụ kiện"
        rating={4.8}
        sold={218}
        price={1250000}
        stock={24}
        badge="Bán chạy"
        image={SAMPLE_IMAGE}
        onAddToCart={fn()}
        onFavorite={fn()}
      />
      <ProductCard
        name="Chuột không dây Lumen M2"
        category="Phụ kiện"
        rating={4.6}
        sold={96}
        price={365000}
        stock={8}
        image={SAMPLE_IMAGE}
        onAddToCart={fn()}
        onFavorite={fn()}
      />
      <ProductCard
        name="Tai nghe Studio Air"
        category="Âm thanh"
        rating={4.9}
        sold={412}
        price={2190000}
        stock={0}
        image={SAMPLE_IMAGE}
        onAddToCart={fn()}
        onFavorite={fn()}
      />
      <ProductCard
        name="Đèn bàn Lumo LED"
        category="Gia dụng"
        rating={4.5}
        sold={64}
        price={450000}
        stock={52}
        image={SAMPLE_IMAGE}
        onAddToCart={fn()}
        onFavorite={fn()}
      />
    </div>
  ),
};
