import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuantitySelector, type QuantitySelectorProps } from './index';

const meta: Meta<QuantitySelectorProps> = {
  title: 'Components/QuantitySelector',
  component: QuantitySelector,
  argTypes: {},
} satisfies Meta<QuantitySelectorProps>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: 1,
    min: 1,
    max: 10,
  },
};

export const Multiple: Story = {
  args: {
    defaultValue: 3,
    min: 1,
  },
};

export const MinReached: Story = {
  args: {
    defaultValue: 1,
    min: 1,
  },
};
