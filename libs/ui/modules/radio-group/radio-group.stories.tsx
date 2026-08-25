import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RadioGroup } from './index';

const meta = {
  title: 'Modules/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  args: { options: [], value: '', onChange: () => {} },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function RadioGroupDemo() {
  const [value, setValue] = useState('standard');
  return (
    <RadioGroup
      value={value}
      onChange={setValue}
      options={[
        { label: 'Standard shipping', value: 'standard' },
        { label: 'Express shipping', value: 'express' },
        { label: 'Pickup (unavailable)', value: 'pickup', disabled: true },
      ]}
    />
  );
}

export const Default: Story = {
  render: () => <RadioGroupDemo />,
};
