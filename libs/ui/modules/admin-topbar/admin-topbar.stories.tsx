import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminTopbar } from './index';

const meta = {
  title: 'Components/AdminTopbar',
  component: AdminTopbar,
  tags: ['autodocs'],
} satisfies Meta<typeof AdminTopbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <AdminTopbar {...args} />,
  args: {
    breadcrumb: [
      { label: 'Home', href: '#' },
      { label: 'Library', href: '#' },
      { label: 'Category', href: '#' },
      { label: 'Books', href: '#' },
    ],
    notifCount: 5,
    user: {
      name: 'DongBui@P4.vn',
      role: 'Quản trị viên',
      avatarUrl: 'https://demoda.vn/wp-content/uploads/2022/11/hinh-anh-zoro.jpg',
    },
    onBellClick: () => alert('Bell clicked'),
  },
};
