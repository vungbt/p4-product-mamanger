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
    appliedCoupon: {
      code: 'SALE10',
      discountLabel: 'đã áp dụng',
    },
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
    const [appliedCoupon, setAppliedCoupon] = useState<
      | {
          code: string;
          discountLabel: string;
        }
      | undefined
    >(undefined);
    const [loading, setLoading] = useState(false);
    const handleApply = () => {
      if (!value.trim()) return;
      args.onApply?.();
      setLoading(true);
      setTimeout(() => {
        setAppliedCoupon({
          code: value.trim().toUpperCase(),
          discountLabel: 'đã áp dụng',
        });
        setValue('');
        setLoading(false);
      }, 1000);
    };

    const handleRemove = () => {
      args.onRemove?.();
      setAppliedCoupon(undefined);
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
        appliedCoupon={appliedCoupon}
        loading={loading}
      />
    );
  },
};
