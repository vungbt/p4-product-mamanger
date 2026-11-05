import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryCard, ProductCard } from '../../components';
import { GridLayout } from './index';

const meta = {
  title: 'Modules/GridLayout',
  component: GridLayout,
  tags: ['autodocs'],
  args: {
    columns: 4,
  },
} satisfies Meta<typeof GridLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleImage = {
  url: 'https://philong.com.vn/media/lib/04-03-2024/ban-phim-co-khong-day-edra-ek398l-philong2.jpg',
};

export const Default: Story = {
  args: {
    columns: 4,
  },
  render: (args) => (
    <GridLayout {...args}>
      <ProductCard
        name="Bàn phím cơ Aurora 68"
        price={1250000}
        stock={24}
        image={sampleImage}
        className="min-w-0 w-full"
      />
      <ProductCard
        name="Chuột không dây Lumen M2"
        price={365000}
        stock={8}
        image={sampleImage}
        className="min-w-0 w-full"
      />
      <ProductCard
        name="Tai nghe Studio Air"
        price={2190000}
        stock={0}
        image={sampleImage}
        className="min-w-0 w-full"
      />
      <ProductCard
        name="Đèn bàn Lumo LED"
        price={450000}
        stock={52}
        image={sampleImage}
        className="min-w-0 w-full"
      />
    </GridLayout>
  ),
};

export const WithColumns: Story = {
  args: {
    columns: 5,
  },
  render: (args) => (
    <GridLayout {...args}>
      <CategoryCard name="Phụ kiện" count={48} icon="keyboard" />
      <CategoryCard name="Lưu trữ" count={15} icon="inbox" />
      <CategoryCard name="Gia dụng" count={31} icon="home" />
      <CategoryCard name="Phụ kiện" count={48} icon="keyboard" />
      <CategoryCard name="Lưu trữ" count={15} icon="inbox" />
    </GridLayout>
  ),
};
