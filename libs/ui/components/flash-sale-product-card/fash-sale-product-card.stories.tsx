import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlashSaleProductCard } from '.';

const meta = {
  title: 'Components/FlashSaleProductCard',
  component: FlashSaleProductCard,
  argTypes: {
    stock: {
      control: 'number',
    },
    sold: {
      control: 'number',
    },
    sale: {
      control: 'number',
    },
    originalPrice: {
      control: 'number',
    },
    salePrice: {
      control: 'number',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FlashSaleProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// The card only sets `min-w-60` (see index.tsx) — its actual rendered width comes from the parent
// layout. A single card with no sizing parent would otherwise stretch to the full canvas width, so
// these single-card stories wrap it in `inline-flex` (shrink-to-fit) to preview it at its natural size.
export const Default: Story = {
  render: (args) => (
    <div className="inline-flex">
      <FlashSaleProductCard {...args} />
    </div>
  ),
  args: {
    sale: 20,
    name: 'Bàn phím cơ AULA SF2099 RGB Mechanical Keyboard',
    description: 'Bàn phím cơ ngon trong tầm giá',
    originalPrice: 2000000,
    salePrice: 1752000,
    image: {
      url: 'https://philong.com.vn/media/lib/04-03-2024/ban-phim-co-khong-day-edra-ek398l-philong2.jpg',
    },
    stock: 30,
    sold: 120,
  },
};
export const WithoutSale: Story = {
  render: (args) => (
    <div className="inline-flex">
      <FlashSaleProductCard {...args} />
    </div>
  ),
  args: {
    sale: 0,
    name: 'Bàn phím cơ AULA SF2099 RGB Mechanical Keyboard',
    description: '',
    originalPrice: 2000000,
    salePrice: 1000000,
    image: {
      url: 'https://philong.com.vn/media/lib/04-03-2024/ban-phim-co-khong-day-edra-ek398l-philong2.jpg',
    },
    stock: 30,
    sold: 120,
  },
};

export const WidthDescription: Story = {
  render: (args) => (
    <div className="inline-flex">
      <FlashSaleProductCard {...args} />
    </div>
  ),
  args: {
    sale: 20,
    name: 'Bàn phím cơ AULA SF2099 RGB Mechanical',
    description: 'Bàn phím cơ ngon trong tầm giá',
    originalPrice: 2000000,
    salePrice: 1000000,
    image: {
      url: 'https://philong.com.vn/media/lib/04-03-2024/ban-phim-co-khong-day-edra-ek398l-philong2.jpg',
    },
    stock: 0,
    sold: 120,
  },
};

// Real usage: a grid of cards, width driven by the parent (`minmax(15rem, 1fr)` — 15rem = the
// component's own `min-w-60` floor), not by the component. Resize the Storybook viewport/panel to see
// the column count reflow while every card stays at least min-w-60 wide.
export const InGrid: Story = {
  args: {
    sale: 20,
    name: 'Bàn phím cơ AULA SF2099 RGB Mechanical Keyboard',
    description: 'Bàn phím cơ ngon trong tầm giá',
    originalPrice: 2000000,
    salePrice: 1752000,
    image: {
      url: 'https://philong.com.vn/media/lib/04-03-2024/ban-phim-co-khong-day-edra-ek398l-philong2.jpg',
    },
    stock: 30,
    sold: 120,
  },
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      {[
        { sale: 20, salePrice: 1752000 },
        { sale: 0, salePrice: 1000000 },
        { sale: 35, salePrice: 899000 },
      ].map((variant, index) => (
        <FlashSaleProductCard
          key={index}
          sale={variant.sale}
          name="Bàn phím cơ AULA SF2099 RGB Mechanical Keyboard"
          description="Bàn phím cơ ngon trong tầm giá"
          originalPrice={2000000}
          salePrice={variant.salePrice}
          image={{
            url: 'https://philong.com.vn/media/lib/04-03-2024/ban-phim-co-khong-day-edra-ek398l-philong2.jpg',
          }}
          stock={30}
          sold={120}
        />
      ))}
    </div>
  ),
};
