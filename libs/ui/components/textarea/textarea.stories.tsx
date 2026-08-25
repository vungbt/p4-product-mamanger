import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Textarea } from './index';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
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
    placeholder: 'Write a product description...',
    color: 'neutral',
    variant: 'outline',
    size: 'middle',
    onChange: fn(),
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithLabel: Story = {
  args: { label: 'Description', required: true },
};

export const WithError: Story = {
  args: { label: 'Description', error: 'Description is required' },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled' },
};
