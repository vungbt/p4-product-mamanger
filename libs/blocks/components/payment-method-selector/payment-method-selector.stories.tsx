import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { PaymentMethodSelector, type PaymentMethodSelectorProps } from './index';

const meta = {
  title: 'Components/PaymentMethodSelector',
  component: PaymentMethodSelector,
  tags: ['autodocs'],
  args: {
    onChange: fn(),
    options: [
      { value: 'cod', label: 'COD khi nhận hàng' },
      { value: 'bank', label: 'Thanh toán qua ngân hàng' },
    ],
    value: 'cod',
  },
} satisfies Meta<typeof PaymentMethodSelector>;
export default meta;
type Story = StoryObj<typeof meta>;
function Interactive(args: PaymentMethodSelectorProps) {
  const [value, setValue] = useState(args.value);
  return (
    <PaymentMethodSelector
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        args.onChange(next);
      }}
    />
  );
}
export const Default: Story = { render: (args) => <Interactive {...args} /> };
export const Example2: Story = {
  render: (args) => <Interactive {...args} />,
  args: {
    value: undefined,
    options: [...meta.args.options, { value: 'express', label: 'Ship hỏa tốc' }],
  },
};
