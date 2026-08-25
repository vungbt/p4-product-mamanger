import type { Meta, StoryObj } from '@storybook/react-vite';
import { Footer } from './index';

// Demo-only — a real app passes in its own logo (e.g. `<BrandLogo variant="header-white" />`), Footer
// doesn't hardcode any project's brand.
const DemoLogo = () => (
  <>
    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary text-13 font-extrabold text-white">
      P4
    </div>
    <div className="text-15 font-extrabold text-neutral-bg">P4 Shop</div>
  </>
);

const meta = {
  title: 'Modules/Footer',
  component: Footer,
  parameters: { layout: 'fullscreen' },
  args: { logo: <DemoLogo /> },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

const ICON_PHONE = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <title>Phone</title>
    <path d="M4 5h4l2 5-2 1a11 11 0 005 5l1-2 5 2v4a15 15 0 01-15-15z" />
  </svg>
);
const ICON_MAIL = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <title>Email</title>
    <path d="M3 6h18v12H3zM3 7l9 6 9-6" />
  </svg>
);
const ICON_PIN = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <title>Location</title>
    <path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z" />
  </svg>
);
const ICON_FACEBOOK = (
  <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-current">
    <title>Facebook</title>
    <path d="M14 8h3V5h-3a4 4 0 00-4 4v2H8v3h2v6h3v-6h3l1-3h-4V9a1 1 0 011-1z" />
  </svg>
);
const ICON_INSTAGRAM = (
  <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-current">
    <title>Instagram</title>
    <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm10 2H7a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3zm-5 3.5A4.5 4.5 0 1112 15.5 4.5 4.5 0 0112 7.5zm0 2A2.5 2.5 0 1014.5 12 2.5 2.5 0 0012 9.5zM17.5 6.8a1 1 0 11-1 1 1 1 0 011-1z" />
  </svg>
);

export const Default: Story = {
  render: () => (
    <Footer
      logo={<DemoLogo />}
      tagline="Cửa hàng thiết bị làm việc chính hãng — bàn phím, chuột, âm thanh, lưu trữ. Dự án training nội bộ P4 Product Manager."
      contacts={[
        { key: 'phone', icon: ICON_PHONE, label: 'Hotline 8:00–21:00', value: '1900 6868' },
        { key: 'mail', icon: ICON_MAIL, label: 'Email hỗ trợ', value: 'hotro@p4shop.vn' },
        { key: 'address', icon: ICON_PIN, label: 'Showroom', value: '28 Lê Lợi, Q.1, TP.HCM' },
      ]}
      linkGroups={[
        {
          key: 'shop',
          title: 'Mua sắm',
          links: [
            { key: 'all', label: 'Tất cả sản phẩm' },
            { key: 'category', label: 'Danh mục' },
            { key: 'promo', label: 'Khuyến mãi' },
            { key: 'new', label: 'Hàng mới về' },
          ],
        },
        {
          key: 'account',
          title: 'Tài khoản',
          links: [
            { key: 'orders', label: 'Đơn hàng của tôi' },
            { key: 'profile', label: 'Thông tin cá nhân' },
            { key: 'cart', label: 'Giỏ hàng' },
            { key: 'saved', label: 'Sản phẩm đã lưu' },
          ],
        },
        {
          key: 'support',
          title: 'Hỗ trợ',
          links: [
            { key: 'return', label: 'Chính sách đổi trả' },
            { key: 'shipping', label: 'Chính sách vận chuyển' },
            { key: 'warranty', label: 'Tra cứu bảo hành' },
            { key: 'faq', label: 'Câu hỏi thường gặp' },
          ],
        },
      ]}
      paymentBadges={[
        { key: 'visa', label: 'VISA' },
        { key: 'mastercard', label: 'Mastercard' },
        { key: 'vnpay', label: 'VNPay' },
        { key: 'momo', label: 'Momo' },
        { key: 'cod', label: 'COD' },
      ]}
      socialLinks={[
        { key: 'facebook', icon: ICON_FACEBOOK, href: 'https://facebook.com', label: 'Facebook' },
        {
          key: 'instagram',
          icon: ICON_INSTAGRAM,
          href: 'https://instagram.com',
          label: 'Instagram',
        },
      ]}
      copyright="© 2026 P4 Shop · Bản thiết kế UI cho dự án training"
      bottomLinks={[
        { key: 'terms', label: 'Điều khoản sử dụng' },
        { key: 'privacy', label: 'Chính sách bảo mật' },
        { key: 'cookie', label: 'Cookie' },
      ]}
    />
  ),
};

export const Minimal: Story = {
  render: () => (
    <Footer
      logo={<DemoLogo />}
      tagline="Cửa hàng thiết bị làm việc chính hãng."
      copyright="© 2026 P4 Shop"
    />
  ),
};
