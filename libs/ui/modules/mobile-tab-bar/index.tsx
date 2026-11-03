import { useTranslation } from 'react-i18next';
import { type IconName, RenderIcon } from '../../components/icons';
import { cn } from '../../helpers';

export type MobileTabKey = 'home' | 'shop' | 'orders' | 'account';

export type MobileTabBarProps = {
  active: MobileTabKey;
  cartCount?: number;
  onChange?: (tab: MobileTabKey) => void;
  className?: string;
};

export function MobileTabBar({ active, cartCount = 0, onChange, className }: MobileTabBarProps) {
  const { t } = useTranslation('ui');

  const tabs: { key: MobileTabKey; label: string; icon: IconName }[] = [
    { key: 'home', label: t('mobileTabBar.home', 'Trang chủ'), icon: 'home' },
    { key: 'shop', label: t('mobileTabBar.shop', 'Shop'), icon: 'cart' },
    { key: 'orders', label: t('mobileTabBar.order', 'Đơn hàng'), icon: 'order' },
    { key: 'account', label: t('mobileTabBar.user', 'Tài khoản'), icon: 'user' },
  ];

  return (
    <nav
      className={cn(
        'flex items-center h-16 w-full min-w-80 bg-neutral-white border border-neutral-border rounded-2xl shadow-sm overflow-hidden',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange?.(tab.key)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors select-none relative',
              isActive
                ? 'text-primary font-bold'
                : 'text-neutral-text-secondary hover:text-neutral-text',
            )}
          >
            <div className="relative">
              <RenderIcon name={tab.icon} className="w-5 h-5" />
              {tab.key === 'shop' && cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-error text-neutral-white text-10 font-bold rounded-full h-5 w-5 px-1 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-11 leading-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
