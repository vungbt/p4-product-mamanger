import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './select';

const OPTIONS = [
  { label: 'Electronics', value: 'electronics' },
  { label: 'Fashion', value: 'fashion' },
  { label: 'Home & Living', value: 'home' },
  { label: 'Sports', value: 'sports' },
  { label: 'Unavailable category', value: 'disabled', isDisabled: true },
];

const meta = {
  title: 'Modules/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'pending', 'neutral'],
    },
    variant: { control: 'select', options: ['solid', 'outline', 'subtle', 'ghost'] },
    size: { control: 'select', options: ['small', 'middle', 'large'] },
  },
  args: {
    options: OPTIONS,
    color: 'neutral',
    variant: 'outline',
    size: 'middle',
    placeholder: 'Select a category...',
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="w-72">
      <Select {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="w-72">
      <Select {...args} label="Category" required icon="frame" />
    </div>
  ),
};

export const Multi: Story = {
  render: (args) => (
    <div className="w-72">
      <Select {...args} isMulti isClearable placeholder="Select categories..." />
    </div>
  ),
};

export const WithError: Story = {
  render: (args) => (
    <div className="w-72">
      <Select {...args} label="Category" error="Please select a category" />
    </div>
  ),
};

export const Loading: Story = {
  render: (args) => (
    <div className="w-72">
      <Select {...args} loading />
    </div>
  ),
};
