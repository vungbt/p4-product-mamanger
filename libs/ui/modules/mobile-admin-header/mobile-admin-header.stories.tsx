import type { Meta, StoryObj } from '@storybook/react-vite';
import { MobileAdminHeader } from './index';

const meta = {
  title: 'modules/MobileAdminHeader',
  component: MobileAdminHeader,
  tags: ['autodocs'],
  argTypes: {
    onMenuClick: {
      action: 'onMenuClick',
    },
  },
} as Meta<typeof MobileAdminHeader>;

export default meta;
type Story = StoryObj<typeof MobileAdminHeader>;

export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <MobileAdminHeader {...args} />
    </div>
  ),
  args: {
    time: '9:41',
    label: 'P4 Shop',
    title: 'Dashboard',
    userInitials: 'Phương Đông',
    onMenuClick: () => alert('Menu clicked'),
    trailing: 'avatar',
  },
};

export const WithAction: Story = {
  render: (args) => (
    <div className="w-80">
      <MobileAdminHeader {...args} />
    </div>
  ),
  args: {
    time: '9:41',
    label: 'P4 Shop',
    title: 'Sản phẩm',
    onMenuClick: () => alert('Menu clicked'),
    trailing: 'action',
  },
};
