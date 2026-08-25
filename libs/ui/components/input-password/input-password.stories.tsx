import type { Meta, StoryObj } from '@storybook/react-vite';
import { InputPassword } from './index';

const meta = {
  title: 'Components/InputPassword',
  component: InputPassword,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'pending', 'neutral'],
    },
    size: { control: 'select', options: ['small', 'middle', 'large'] },
  },
  args: {
    placeholder: '••••••••',
    color: 'neutral',
    size: 'middle',
  },
} satisfies Meta<typeof InputPassword>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="w-72">
      <InputPassword {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="w-72">
      <InputPassword {...args} label="Password" required icon="key" />
    </div>
  ),
};

export const WithError: Story = {
  render: (args) => (
    <div className="w-72">
      <InputPassword {...args} label="Password" error="Password must be at least 6 characters" />
    </div>
  ),
};
