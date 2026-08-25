import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { InputNumber } from './index';

const COLORS = ['primary', 'secondary', 'success', 'error', 'pending', 'neutral'] as const;
const VARIANTS = ['outline', 'solid', 'subtle'] as const;
const SIZES = ['small', 'middle', 'large'] as const;

const meta = {
  title: 'Components/InputNumber',
  component: InputNumber,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: COLORS },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
  },
  args: {
    value: 3,
    min: 0,
    max: 99,
    step: 1,
    color: 'neutral',
    variant: 'outline',
    size: 'middle',
  },
} satisfies Meta<typeof InputNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [val, setVal] = useState(args.value ?? 3);
    return <InputNumber {...args} value={val} onChange={setVal} />;
  },
};

export const WithLabel: Story = {
  render: function Render() {
    const [val, setVal] = useState(1);
    return <InputNumber label="Số lượng" required value={val} onChange={setVal} min={1} max={10} />;
  },
};

export const AllSizes: Story = {
  render: function Render() {
    const [values, setValues] = useState({ small: 2, middle: 5, large: 10 });
    return (
      <div className="flex items-end gap-6">
        {SIZES.map((size) => (
          <InputNumber
            key={size}
            size={size}
            value={values[size]}
            onChange={(v) => setValues((prev) => ({ ...prev, [size]: v }))}
            label={size}
            min={0}
            max={99}
          />
        ))}
      </div>
    );
  },
};

export const AllColors: Story = {
  render: function Render() {
    const [val, setVal] = useState(5);
    return (
      <div className="flex flex-wrap items-center gap-4">
        {COLORS.map((color) => (
          <InputNumber key={color} color={color} value={val} onChange={setVal} min={0} max={20} />
        ))}
      </div>
    );
  },
};

export const MinMaxReached: Story = {
  render: function Render() {
    const [val, setVal] = useState(1);
    return (
      <div className="flex flex-col gap-4">
        <InputNumber label="min=1, max=5" value={val} onChange={setVal} min={1} max={5} />
        <p className="text-13 text-neutral-text-secondary">
          Nút − sẽ disabled khi value = min, nút + disabled khi value = max.
        </p>
      </div>
    );
  },
};

export const WithError: Story = {
  render: function Render() {
    const [val, setVal] = useState(0);
    return (
      <InputNumber
        label="Tồn kho"
        value={val}
        onChange={setVal}
        min={0}
        color="error"
        error="Số lượng không được để trống"
      />
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: 7 },
};

export const CustomStep: Story = {
  render: function Render() {
    const [val, setVal] = useState(50);
    return (
      <InputNumber
        label="Giá (×10,000₫)"
        value={val}
        onChange={setVal}
        step={10}
        min={0}
        max={1000}
      />
    );
  },
};
