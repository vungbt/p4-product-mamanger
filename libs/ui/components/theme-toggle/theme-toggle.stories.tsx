import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeToggle } from './index';

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Toggles `.dark` on `document.documentElement` via `useDarkMode` (persists to `localStorage["p4-theme"]`). Use the "theme" toolbar control (sun/moon icon) at the top of the Storybook UI to preview both palettes without clicking the button itself.',
      },
    },
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
