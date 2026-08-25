import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';
import type React from 'react';
import { useState } from 'react';
import { Tag } from '../../components/tag';
import { Table } from './index';

type ProductRow = {
  id: number;
  name: string;
  category: string;
  stock: number;
  status: 'active' | 'draft';
};

const DATA: ProductRow[] = [
  { id: 1, name: 'Nike Air Max 270', category: 'Sneakers', stock: 42, status: 'active' },
  { id: 2, name: 'Adidas Ultraboost', category: 'Sneakers', stock: 0, status: 'draft' },
  { id: 3, name: 'Uniqlo Oxford Shirt', category: 'Apparel', stock: 18, status: 'active' },
];

const columns: ColumnDef<ProductRow>[] = [
  { header: 'Product', accessorKey: 'name' },
  { header: 'Category', accessorKey: 'category' },
  { header: 'Stock', accessorKey: 'stock' },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => {
      const status = getValue<ProductRow['status']>();
      return status === 'active' ? (
        <Tag content="Active" color="#22c55e" />
      ) : (
        <Tag content="Draft" color="#94a3b8" />
      );
    },
  },
];

/**
 * `Table` is a generic component (`Table<T>`), which Storybook's `Meta<typeof Component>`
 * cannot express directly. We wrap it in a component fixed to `ProductRow` just for the
 * story's type-checking — the props/behaviour below are 1:1 with `<Table<ProductRow> ...>`.
 */
type ProductTableProps = {
  data?: ProductRow[];
  loading?: boolean;
  pagination?: {
    total?: number;
    page?: number;
    pageCount?: number;
    limit?: number;
    onChangePage?: (value: number) => void;
  };
  rowSelection?: {
    type: 'checkbox' | 'radio';
    selectedRowKeys?: React.Key[];
    onChange?: (selectedKeys: React.Key[], selectedRows: ProductRow[]) => void;
  };
};

function ProductTable({ data = DATA, ...rest }: ProductTableProps) {
  return <Table columns={columns} data={data} rowKey="id" {...rest} />;
}

const meta = {
  title: 'Modules/Table',
  component: ProductTable,
  tags: ['autodocs'],
} satisfies Meta<typeof ProductTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true },
};

export const Empty: Story = {
  args: { data: [] },
};

function WithSelectionDemo() {
  const [selected, setSelected] = useState<React.Key[]>([]);
  return (
    <ProductTable
      rowSelection={{
        type: 'checkbox',
        selectedRowKeys: selected,
        onChange: (keys) => setSelected(keys),
      }}
    />
  );
}

export const WithRowSelection: Story = {
  render: () => <WithSelectionDemo />,
};

export const WithPagination: Story = {
  args: {
    pagination: { total: 42, page: 1, limit: 3, onChangePage: () => {} },
  },
};
