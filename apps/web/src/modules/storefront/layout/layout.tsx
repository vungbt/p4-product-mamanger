import { Outlet } from 'react-router-dom';
import StorefrontFooter from './footer';
import StorefrontHeader from './header';

export default function StorefrontLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink" data-portal="storefront">
      <StorefrontHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <StorefrontFooter />
    </div>
  );
}
