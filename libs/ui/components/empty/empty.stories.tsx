import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { Empty } from './index';

const meta = {
  title: 'Components/Empty',
  component: Empty,
  tags: ['autodocs'],
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    title: 'No orders yet',
    description: 'Orders placed by customers will show up here.',
    icon: 'shopping-cart',
  },
};

export const WithAction: Story = {
  args: {
    title: 'No products',
    description: 'Start by adding your first product to the catalog.',
    icon: 'package',
    action: <Button icon="add">Add product</Button>,
  },
};
