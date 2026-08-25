import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { DatePicker } from './datepicker';

const COLORS = ['primary', 'secondary', 'success', 'error', 'pending', 'neutral'] as const;

const meta = {
  title: 'Modules/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: COLORS },
    variant: { control: 'select', options: ['solid', 'outline', 'subtle', 'ghost'] },
    size: { control: 'select', options: ['small', 'middle', 'large'] },
  },
  args: {
    color: 'neutral',
    variant: 'outline',
    size: 'middle',
    onChange: fn(),
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveDatePicker(args: React.ComponentProps<typeof DatePicker>) {
  const [value, setValue] = useState<Date | null>(null);
  return (
    <div className="w-72">
      <DatePicker
        {...args}
        value={value}
        onChange={(date) => {
          setValue(date);
          args.onChange?.(date);
        }}
      />
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <InteractiveDatePicker {...args} />,
};

export const Clearable: Story = {
  render: (args) => <InteractiveDatePicker {...args} isClearable />,
};

export const WithError: Story = {
  render: (args) => <InteractiveDatePicker {...args} error="Please pick a valid date" />,
};

export const Disabled: Story = {
  render: (args) => <InteractiveDatePicker {...args} disabled />,
};
