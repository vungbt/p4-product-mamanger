import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from '../../components/icon-button';
import { RenderIcon } from '../../components/icons';
import { UserChip } from '../../components/user-chip';
import { AdminHeader } from './index';

const meta = {
  title: 'Modules/AdminHeader',
  component: AdminHeader,
  parameters: { layout: 'fullscreen' },
  args: { breadcrumbs: [{ label: 'Admin' }, { label: 'Dashboard' }] },
} satisfies Meta<typeof AdminHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

// Demo-only — just shows a static date range per the design. A real app can swap in
// `<DateRangePicker />` (already available in the lib) for actual interactive filtering.
const DateRangeChip = () => (
  <div className="flex h-[38px] items-center gap-2.5 rounded-lg border border-neutral-border px-3.5 text-14 text-neutral-text-secondary">
    <RenderIcon name="calendar-date-range" className="!h-4 !w-4 text-secondary" />
    01/08 – 18/08/2026
  </div>
);

export const Default: Story = {
  render: () => (
    <AdminHeader
      breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
      actions={
        <>
          <DateRangeChip />
          <IconButton
            icon="bell"
            shape="square"
            variant="outline"
            color="neutral"
            badge={3}
            badgeColor="error"
          />
          <UserChip
            name="admin@p4.dev"
            subtitle="Quản trị viên"
            customClasses={{ avatar: '!bg-neutral-bg !border-neutral !text-secondary' }}
            dropdownItems={[
              { key: 'profile', label: 'Thông tin tài khoản' },
              { key: 'logout', label: 'Đăng xuất' },
            ]}
          />
        </>
      }
    />
  ),
};

export const DeepBreadcrumb: Story = {
  render: () => (
    <AdminHeader
      breadcrumbs={[
        { label: 'Admin', href: '#' },
        { label: 'Sản phẩm', href: '#' },
        { label: 'Chỉnh sửa' },
      ]}
      actions={
        <UserChip
          name="admin@p4.dev"
          subtitle="Quản trị viên"
          customClasses={{ avatar: '!bg-neutral-bg !border-neutral !text-secondary' }}
        />
      }
    />
  ),
};
