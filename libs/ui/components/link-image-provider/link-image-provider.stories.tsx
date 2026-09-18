import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Link as RouterLink } from 'react-router-dom';
import { LinkImageProvider, UiImage, UiLink, type UiLinkProps } from './index';

const meta: Meta<typeof LinkImageProvider> = {
  title: 'Components/LinkImageProvider',
  component: LinkImageProvider,
};

export default meta;
type Story = StoryObj<typeof meta>;

// react-router-dom's <Link> throws outside a Router, so any story using it must be wrapped in
// MemoryRouter — apps/web wires the real BrowserRouter + LinkImageProvider once in src/app.tsx instead.
function RouterUiLink({ href, className, children, onClick, title }: UiLinkProps) {
  return (
    <RouterLink className={className} onClick={onClick} title={title} to={href}>
      {children}
    </RouterLink>
  );
}

export const WithoutProvider: Story = {
  render: () => (
    <div className="grid gap-4">
      <UiLink className="text-primary underline" href="/du-tru">
        Đi tới Dự trù (thẻ &lt;a&gt; mặc định)
      </UiLink>
      <UiImage
        alt="Ảnh minh hoạ"
        className="rounded-lg"
        height={80}
        src="https://i.pravatar.cc/80"
        width={80}
      />
    </div>
  ),
};

export const WithReactRouterLink: Story = {
  render: () => (
    <MemoryRouter>
      <LinkImageProvider Link={RouterUiLink}>
        <div className="grid gap-4">
          <UiLink className="text-primary underline" href="/du-tru">
            Đi tới Dự trù (react-router-dom Link thật)
          </UiLink>
          <UiImage
            alt="Ảnh minh hoạ"
            className="rounded-lg"
            height={80}
            src="https://i.pravatar.cc/80"
            width={80}
          />
        </div>
      </LinkImageProvider>
    </MemoryRouter>
  ),
};
