import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { TimePicker } from './timepicker';

const meta = {
  title: 'Modules/TimePicker',
  component: TimePicker,
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
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveTimePicker(args: React.ComponentProps<typeof TimePicker>) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <div className="w-56">
      <TimePicker
        {...args}
        value={value}
        onChange={(time) => {
          setValue(time);
          args.onChange?.(time);
        }}
      />
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <InteractiveTimePicker {...args} />,
};

export const Clearable: Story = {
  render: (args) => <InteractiveTimePicker {...args} isClearable />,
};
