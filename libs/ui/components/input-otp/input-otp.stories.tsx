import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { InputOtp, type InputOtpRef } from './index';

const SIZES = ['small', 'middle', 'large'] as const;
const COLORS = ['primary', 'neutral', 'error'] as const;

const meta = {
  title: 'Components/InputOtp',
  component: InputOtp,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: SIZES },
    color: { control: 'select', options: COLORS },
    length: { control: { type: 'number', min: 4, max: 8 } },
    mask: { control: 'boolean' },
    autoFocus: { control: 'boolean' },
  },
  args: {
    length: 6,
    size: 'middle',
    color: 'primary',
    mask: false,
    autoFocus: false,
    placeholder: '○',
  },
} satisfies Meta<typeof InputOtp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <div className="flex flex-col gap-3">
        <InputOtp {...args} value={value} onChange={setValue} />
        <p className="text-13 text-neutral-text-secondary">
          Value: <code className="font-mono text-neutral-text-primary">{value || '(empty)'}</code>
        </p>
      </div>
    );
  },
};

export const WithLabel: Story = {
  render: function Render() {
    const [value, setValue] = useState('');
    return (
      <InputOtp
        label="Mã xác thực"
        required
        value={value}
        onChange={setValue}
        onComplete={(otp) => alert(`OTP complete: ${otp}`)}
      />
    );
  },
};

export const FourDigits: Story = {
  render: function Render() {
    const [value, setValue] = useState('');
    return <InputOtp length={4} value={value} onChange={setValue} label="Mã PIN (4 số)" />;
  },
};

export const Masked: Story = {
  render: function Render() {
    const [value, setValue] = useState('1234');
    return <InputOtp length={4} mask value={value} onChange={setValue} label="PIN (masked)" />;
  },
};

export const ErrorState: Story = {
  render: function Render() {
    const [value, setValue] = useState('123456');
    return (
      <InputOtp
        length={6}
        value={value}
        onChange={setValue}
        color="error"
        error="Mã OTP không đúng. Vui lòng thử lại."
        label="Nhập mã OTP"
      />
    );
  },
};

export const AllSizes: Story = {
  render: function Render() {
    return (
      <div className="flex flex-col gap-6">
        {SIZES.map((size) => (
          <InputOtp key={size} size={size} length={6} label={size} value="429" />
        ))}
      </div>
    );
  },
};

export const AutoFocus: Story = {
  args: { autoFocus: true, label: 'Auto-focused on mount' },
  render: function Render(args) {
    const [value, setValue] = useState('');
    return <InputOtp {...args} value={value} onChange={setValue} />;
  },
};

export const WithRefControl: Story = {
  render: function Render() {
    const ref = useRef<InputOtpRef>(null);
    const [value, setValue] = useState('429851');

    return (
      <div className="flex flex-col gap-4">
        <InputOtp ref={ref} value={value} onChange={setValue} label="Ref control demo" />
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-13 font-bold text-white"
            onClick={() => ref.current?.focus()}
          >
            Focus
          </button>
          <button
            type="button"
            className="rounded-lg border border-neutral-border px-4 py-2 text-13 font-bold"
            onClick={() => ref.current?.clear()}
          >
            Clear
          </button>
        </div>
      </div>
    );
  },
};

export const PasteDemo: Story = {
  render: function Render() {
    const [value, setValue] = useState('');
    return (
      <div className="flex flex-col gap-3">
        <InputOtp value={value} onChange={setValue} label="Paste test — try Ctrl+V '847291'" />
        <p className="text-12 text-neutral-text-secondary">
          Copy "847291" và paste vào slot bất kỳ — các slot sẽ tự điền.
        </p>
      </div>
    );
  },
};
