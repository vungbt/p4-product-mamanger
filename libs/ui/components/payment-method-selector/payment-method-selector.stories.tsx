import type { Meta } from '@storybook/react-vite';
import { useState } from 'react';
import { PaymentMethodSelector } from './index';

const meta: Meta<typeof PaymentMethodSelector> = {
  title: 'Components/PaymentMethodSelector',
  component: PaymentMethodSelector,
  argTypes: {
    options: {
      control: 'object',
    },
    value: {
      control: 'text',
    },
    onChange: {
      action: 'changed',
    },
  },
  tags: ['autodocs'],
};
export default meta;

const Template = (args: any) => {
  const [value, setValue] = useState(args.value);
  const onChange = (value: string) => {
    setValue(value);
    args.onChange(value);
  };
  return <PaymentMethodSelector {...args} value={value} onChange={onChange} />;
};

export const Default = Template.bind({});
(Default as any).args = {
  options: [
    {
      value: 'COD khi nhận hàng',
      label: 'COD khi nhận hàng',
    },
    {
      value: 'Thanh toán qua ngân hàng',
      label: 'Thanh toán qua ngân hàng',
    },
  ],
  value: 'COD khi nhận hàng',
};

export const Example2 = Template.bind({});
(Example2 as any).args = {
  options: [
    {
      value: 'COD khi nhận hàng',
      label: 'COD khi nhận hàng',
    },
    {
      value: 'Thanh toán qua ngân hàng',
      label: 'Thanh toán qua ngân hàng',
    },
    {
      value: 'Ship hỏa tốc',
      label: 'Ship hỏa tốc',
    },
  ],
};
