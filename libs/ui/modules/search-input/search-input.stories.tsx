import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SearchInput } from './index';

const meta = {
  title: 'Modules/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  args: {
    value: '',
    onChange: () => {},
    placeholder: 'Tìm bàn phím cơ, tai nghe, SSD…',
  },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function PlainDemo() {
  const [value, setValue] = useState('');
  return (
    <SearchInput
      value={value}
      onChange={setValue}
      placeholder="Tìm bàn phím cơ, tai nghe, SSD…"
      onSearch={(v) => alert(`Tìm: ${v}`)}
    />
  );
}

export const Default: Story = {
  render: () => <PlainDemo />,
};

function WithCategoriesDemo() {
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('');
  return (
    <SearchInput
      value={value}
      onChange={setValue}
      category={category}
      onCategoryChange={setCategory}
      categories={[
        { label: 'Bàn phím', value: 'keyboard' },
        { label: 'Tai nghe', value: 'headphone' },
        { label: 'SSD', value: 'ssd' },
      ]}
      placeholder="Tìm bàn phím cơ, tai nghe, SSD…"
      onSearch={(v, c) => alert(`Tìm "${v}" trong danh mục "${c || 'Tất cả'}"`)}
    />
  );
}

export const WithCategories: Story = {
  render: () => <WithCategoriesDemo />,
};
