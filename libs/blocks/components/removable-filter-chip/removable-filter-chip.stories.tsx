import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RemovableFilterChip } from '.';

const meta = {
  title: 'Components/RemovableFilterChip',
  component: RemovableFilterChip,
  argTypes: {
    label: { control: 'text' },
  },
  args: {
    label: '',
    onRemove: () => {},
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RemovableFilterChip>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => {
    const [filters, setFilters] = useState([
      'bàn phím cơ',
      'tai nghe chống ồn',
      'SSD 1TB',
      'hub USB-C',
    ]);

    return (
      <div className="flex flex-wrap items-center gap-3 p-4">
        {filters.map((filter: string) => (
          <RemovableFilterChip
            key={filter}
            label={filter}
            onRemove={() =>
              setFilters((prev: string[]) => prev.filter((item: string) => item !== filter))
            }
          />
        ))}
      </div>
    );
  },
};
