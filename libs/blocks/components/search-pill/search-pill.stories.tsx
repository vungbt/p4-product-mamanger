import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SearchPill } from './index';

const meta: Meta<typeof SearchPill> = {
  title: 'Components/SearchPill',
  component: SearchPill,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    tone: { control: { type: 'select', options: ['default', 'subtle'] } },
    onChange: { action: 'changed' },
    onClear: { action: 'cleared' },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    return <SearchPill {...args} className="w-64" />;
  },
  args: {
    value: '',
    placeholder: 'Tìm theo tên sản phẩm...',
    tone: 'default',
  },
};

export const WithDefault: Story = {
  render: (args) => {
    return <SearchPill {...args} className="w-64" />;
  },
  args: {
    value: 'Bàn phím cơ',
    placeholder: 'Tìm theo tên sản phẩm...',
    tone: 'default',
  },
};

export const WithSubtle: Story = {
  render: (args) => {
    return <SearchPill {...args} className="w-64" />;
  },
  args: {
    value: 'Màn hình pc',
    placeholder: '',
    tone: 'subtle',
  },
};

export const Interactive: Story = {
  render: function Render(args) {
    const [val, setVal] = useState('');
    return (
      <SearchPill
        {...args}
        value={val}
        onChange={(val) => setVal(val)}
        onClear={() => setVal('')}
      />
    );
  },
};
