import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RadioButtonGroup } from './index';

const meta = {
  title: 'Modules/RadioButtonGroup',
  component: RadioButtonGroup,
  tags: ['autodocs'],
  args: { options: [], value: '', onChange: () => {} },
} satisfies Meta<typeof RadioButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function RadioButtonGroupDemo() {
  const [value, setValue] = useState('week');
  return (
    <RadioButtonGroup
      value={value}
      onChange={setValue}
      options={[
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month', icon: 'calendar' },
      ]}
    />
  );
}

export const Default: Story = {
  render: () => <RadioButtonGroupDemo />,
};
