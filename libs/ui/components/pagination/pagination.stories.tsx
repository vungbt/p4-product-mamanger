import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Pagination } from './index';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  // Meta-level defaults so `Story['args']` is fully satisfied even for stories that
  // override rendering via `render` (Storybook/TS requires all non-optional component
  // props to have a value somewhere — meta.args is that "somewhere").
  args: {
    page: 1,
    limit: 10,
    total: 97,
    onChangePage: () => {},
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractivePagination() {
  const [page, setPage] = useState(1);
  return <Pagination page={page} limit={10} total={97} onChangePage={setPage} />;
}

export const Default: Story = {
  render: () => <InteractivePagination />,
};

export const FirstPage: Story = {
  args: { page: 1, limit: 10, total: 42 },
};

export const LastPage: Story = {
  args: { page: 5, limit: 10, total: 42 },
};
