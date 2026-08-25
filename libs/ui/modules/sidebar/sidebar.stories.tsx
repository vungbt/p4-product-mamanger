import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserChip } from '../../components/user-chip';
import { Sidebar } from './index';

// Demo-only — a real app passes in its own logo (e.g. `<BrandLogo variant="mark" />`), Sidebar
// doesn't hardcode any project's brand.
const DemoLogo = () => (
  <>
    <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-primary text-12 font-extrabold text-white">
      P4
    </div>
    <div className="whitespace-nowrap text-[13.5px] font-extrabold text-neutral-text-primary">
      Product Manager
    </div>
  </>
);

const meta = {
  title: 'Modules/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
  args: { logo: <DemoLogo />, sections: [] },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// SVG copied verbatim from docs/design/p4-product-manager-design.html — a dedicated icon for the admin menu,
// not using the shared icon set because this specific shape (pixel-matching the design) isn't available in iconMap.
const ICON_DASHBOARD = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <title>Dashboard</title>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);
const ICON_PRODUCT = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <title>Product</title>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8" />
  </svg>
);
const ICON_ORDER = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <title>Order</title>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
);
const ICON_CATEGORY = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <title>Category</title>
    <path d="M3 12V5a2 2 0 012-2h7l9 9-9 9-9-9z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
);
const ICON_COUPON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <title>Coupon</title>
    <path d="M3 9V6h18v3a2.5 2.5 0 000 5v3H3v-3a2.5 2.5 0 000-5z" />
    <path d="M12 7v10" strokeDasharray="2 3" />
  </svg>
);
const ICON_REFUND = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <title>Refund</title>
    <path d="M4 10h11a5 5 0 010 10H9" />
    <path d="M8 6l-4 4 4 4" />
  </svg>
);

// The "Promotions" group renders as a submenu (children) — demos the newly added menu-nesting
// capability, matching a real admin need (e.g. Coupons / Refunds grouped under one parent item).
const SECTIONS = [
  {
    key: 'main',
    items: [
      { key: 'dashboard', icon: ICON_DASHBOARD, label: 'Dashboard', href: '#', active: true },
      { key: 'product', icon: ICON_PRODUCT, label: 'Sản phẩm', href: '#' },
      { key: 'order', icon: ICON_ORDER, label: 'Đơn hàng', href: '#' },
      {
        key: 'promotion',
        icon: ICON_COUPON,
        label: 'Khuyến mãi',
        children: [
          { key: 'coupon', icon: ICON_COUPON, label: 'Mã giảm giá', href: '#' },
          { key: 'refund', icon: ICON_REFUND, label: 'Hoàn tiền', href: '#' },
        ],
      },
    ],
  },
  {
    key: 'more',
    title: 'Đề xuất thêm',
    items: [{ key: 'category', icon: ICON_CATEGORY, label: 'Danh mục', href: '#' }],
  },
];

const FOOTER = (
  <UserChip
    name="admin@p4.dev"
    subtitle="Quản trị viên"
    customClasses={{
      root: 'rounded-none border-none p-0',
      avatar: '!bg-neutral-bg !border-neutral !text-secondary',
    }}
  />
);

export const Default: Story = {
  render: () => (
    <div style={{ height: 600 }}>
      <Sidebar logo={<DemoLogo />} sections={SECTIONS} footer={FOOTER} />
    </div>
  ),
};

// Collapsed mode — icon-only, used when the user clicks the sidebar-collapse button (e.g. the real AdminSidebar).
export const Collapsed: Story = {
  render: () => (
    <div style={{ height: 600 }}>
      <Sidebar logo={<DemoLogo />} sections={SECTIONS} footer={FOOTER} collapsed />
    </div>
  ),
};
