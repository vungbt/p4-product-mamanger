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
export const Default: Story = {
  render: (args) => (
    <div className="inline-flex w-[260px]">
      <FlashSaleProductCard {...args} />
    </div>
  ),
  args: {
    sale: 20,
    name: 'Bàn phím cơ AULA SF2099 RGB Mechanical Keyboard',
    description: 'Bàn phím cơ ngon trong tầm giá',
    originalPrice: 2000000,
    salePrice: 1752000,
    imageUrl:
      'https://philong.com.vn/media/lib/04-03-2024/ban-phim-co-khong-day-edra-ek398l-philong2.jpg',
    stock: 30,
    sold: 120,
  },
};
export const WithoutSale: Story = {
  render: (args) => (
    <div className=" gap-2 flex-nowrap grid grid-cols-4  ">
      <FlashSaleProductCard {...args} />
      <FlashSaleProductCard {...args} />
      <FlashSaleProductCard {...args} />
      <FlashSaleProductCard {...args} />
      <FlashSaleProductCard {...args} />
      <FlashSaleProductCard {...args} />
      <FlashSaleProductCard {...args} />
      <FlashSaleProductCard {...args} />
    </div>
  ),
  args: {
    sale: 0,
    name: 'Bàn phím cơ AULA SF2099 RGB Mechanical Keyboard',
    description: '',
    originalPrice: 2000000,
    salePrice: 1000000,
    imageUrl:
      'https://philong.com.vn/media/lib/04-03-2024/ban-phim-co-khong-day-edra-ek398l-philong2.jpg',
    stock: 30,
    sold: 120,
  },
};

export const WidthDescription: Story = {
  render: (args) => (
    <div className="inline-flex">
      <FlashSaleProductCard {...args} />
      <FlashSaleProductCard {...args} />
    </div>
  ),
  args: {
    sale: 20,
    name: 'Bàn phím cơ AULA SF2099 RGB Mechanical',
    description: 'Bàn phím cơ ngon trong tầm giá',
    originalPrice: 2000000,
    salePrice: 1000000,
    imageUrl:
      'https://philong.com.vn/media/lib/04-03-2024/ban-phim-co-khong-day-edra-ek398l-philong2.jpg',
    stock: 0,
    sold: 120,
  },
};
