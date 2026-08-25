import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { IconButton } from '../../components/icon-button';
import { UserChip } from '../../components/user-chip';
import { SearchInput } from '../search-input';
import { Header } from './index';

// Demo-only — a real app passes in its own logo, e.g. `<BrandLogo variant="header" />`
// (apps/web/src/libraries/brand-logo.tsx), Header doesn't hardcode any project's brand.
const DemoLogo = () => (
  <>
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-13 font-extrabold text-white">
      P4
    </div>
    <div className="whitespace-nowrap text-15 font-extrabold tracking-[-0.01em] text-neutral-text-primary">
      P4 Shop
    </div>
  </>
);

const meta = {
  title: 'Modules/Header',
  component: Header,
  parameters: { layout: 'fullscreen' },
  args: { logo: <DemoLogo /> },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

const NAV_ITEMS = [
  { key: 'products', label: 'Sản phẩm', href: '#', active: true },
  { key: 'orders', label: 'Đơn hàng của tôi', href: '#' },
  { key: 'account', label: 'Tài khoản', href: '#' },
];

function HeaderDemo() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  return (
    <Header
      logo={<DemoLogo />}
      navItems={NAV_ITEMS}
      search={
        <SearchInput
          value={query}
          onChange={setQuery}
          category={category}
          onCategoryChange={setCategory}
          categories={[
            { value: 'keyboard', label: 'Bàn phím' },
            { value: 'headphone', label: 'Tai nghe' },
            { value: 'ssd', label: 'SSD' },
          ]}
          placeholder="Tìm bàn phím cơ, tai nghe, SSD…"
        />
      }
      actions={
        <>
          <IconButton
            icon="shopping-cart"
            shape="square"
            variant="outline"
            color="neutral"
            badge={3}
          />
          <UserChip name="Ngọc Lan" />
        </>
      }
    />
  );
}

export const Default: Story = {
  render: () => <HeaderDemo />,
};

export const WithDropdownUser: Story = {
  render: () => (
    <Header
      logo={<DemoLogo />}
      navItems={NAV_ITEMS}
      actions={
        <>
          <IconButton
            icon="shopping-cart"
            shape="square"
            variant="outline"
            color="neutral"
            badge={3}
          />
          <UserChip
            name="Ngọc Lan"
            dropdownItems={[
              { key: 'profile', label: 'Tài khoản của tôi' },
              { key: 'orders', label: 'Đơn hàng của tôi' },
              { key: 'logout', label: 'Đăng xuất' },
            ]}
          />
        </>
      }
    />
  ),
};

export const Minimal: Story = {
  render: () => <Header logo={<DemoLogo />} navItems={NAV_ITEMS} />,
};
