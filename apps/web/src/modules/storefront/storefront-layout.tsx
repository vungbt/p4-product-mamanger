import { Outlet } from 'react-router-dom';
import StorefrontFooter from './storefront-footer';
import StorefrontHeader from './storefront-header';

export default function StorefrontLayout() {
  return (
    <div
      className="flex min-h-screen flex-col bg-neutral-bg text-neutral-text-primary"
      data-portal="storefront"
    >
      <StorefrontHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <StorefrontFooter />
    </div>
  );
}
