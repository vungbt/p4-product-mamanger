import { Breadcrumb } from '@itclabs/react-ui';
import useAdminBreadcrumbs from './use-admin-breadcrumbs';

export default function AdminBreadcrumb() {
  const breadcrumbs = useAdminBreadcrumbs();

  return (
    <Breadcrumb
      items={breadcrumbs.map(({ key, label }) => ({ key, title: label }))}
      className="min-w-0"
    />
  );
}
