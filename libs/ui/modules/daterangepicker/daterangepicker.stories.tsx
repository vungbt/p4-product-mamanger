import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { type DateRange, DateRangePicker } from './daterangepicker';

const meta = {
  title: 'Modules/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'pending', 'neutral'],
    },
    size: { control: 'select', options: ['small', 'middle', 'large'] },
  },
  args: {
    color: 'neutral',
    size: 'middle',
    onChange: fn(),
  },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveRangePicker(args: React.ComponentProps<typeof DateRangePicker>) {
  const [value, setValue] = useState<DateRange | null>(null);
  return (
    <div className="w-80">
      <DateRangePicker
        {...args}
        value={value}
        onChange={(range) => {
          setValue(range);
          args.onChange?.(range);
        }}
      />
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <InteractiveRangePicker {...args} />,
};

export const Clearable: Story = {
  render: (args) => <InteractiveRangePicker {...args} isClearable />,
};
