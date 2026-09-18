import type { Meta, StoryObj } from '@storybook/react-vite';
import { type TabItem, Tabs } from './index';

// Explicit `TabItem[]` annotation so each `icon` literal is checked against `IconName`
// right here — without it, TS widens `icon` to plain `string` and the assignment to
// `meta.args.tabs` fails.
const TAB_ITEMS: TabItem[] = [
  { label: 'Overview', value: 0, content: 'Overview content goes here.' },
  { label: 'Reviews', value: 1, icon: 'star-solid', content: 'Reviews content goes here.' },
  { label: 'Shipping', value: 2, content: 'Shipping content goes here.' },
];

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['line', 'card'] },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'pending', 'neutral'],
    },
    size: { control: 'select', options: ['small', 'middle', 'large'] },
  },
  args: {
    tabs: TAB_ITEMS,
    variant: 'line',
    color: 'primary',
    size: 'middle',
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LineVariant: Story = {};

export const CardVariant: Story = {
  args: { variant: 'card' },
};

const ICON_TAB_ITEMS: TabItem[] = [
  { label: 'Home', value: 0, icon: 'home', content: 'Home content' },
  { label: 'Orders', value: 1, icon: 'shopping-cart', content: 'Orders content' },
  { label: 'Settings', value: 2, icon: 'settings', content: 'Settings content' },
];

export const WithIcons: Story = {
  args: { tabs: ICON_TAB_ITEMS },
};
