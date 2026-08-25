import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from './index';

const meta = {
  title: 'Components/Box',
  component: Box,
  tags: ['autodocs'],
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Box className="w-80">
      <p className="text-14 font-semibold text-neutral-text-primary">Card title</p>
      <p className="mt-1 text-14 text-neutral-text-secondary">
        `Box` is the base surface used across dashboards — rounded corners, soft shadow and a subtle
        primary-tinted border.
      </p>
    </Box>
  ),
};

export const CustomPadding: Story = {
  render: () => (
    <Box className="w-80 p-8">
      <p className="text-14 text-neutral-text-secondary">Override padding via `className`.</p>
    </Box>
  ),
};
