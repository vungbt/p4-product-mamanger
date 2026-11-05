import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CouponInputBar } from './index';

const meta: Meta<typeof CouponInputBar> = {
  title: 'Components/CouponInputBar',
  component: CouponInputBar,
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: 'changed' },
    onApply: { action: 'applied' },
    onRemove: { action: 'removed' },
  },
  decorators: [
    (Story) => (
      <div className="w-96 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof CouponInputBar>;

export const Default: Story = {
  args: {
    value: '',
    placeholder: 'Nhập mã giảm giá',
    loading: false,
  },
};

export const AppliedState: Story = {
  args: {
    value: '',
    couponCode: 'SALE10',
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    value: 'SALE10',
    loading: true,
  },
};

export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('');
    const [couponCode, setCouponCode] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const handleApply = () => {
      if (!value.trim()) return;
      args.onApply?.();
      setLoading(true);
      setTimeout(() => {
        setCouponCode(value.trim().toUpperCase());
        setValue('');
        setLoading(false);
      }, 1000);
    };

    const handleRemove = () => {
      args.onRemove?.();
      setCouponCode(undefined);
    };

    return (
      <CouponInputBar
        {...args}
        value={value}
        onChange={(val) => {
          setValue(val);
          args.onChange?.(val);
        }}
        onApply={handleApply}
        onRemove={handleRemove}
        couponCode={couponCode}
        loading={loading}
      />
    );
  },
};
