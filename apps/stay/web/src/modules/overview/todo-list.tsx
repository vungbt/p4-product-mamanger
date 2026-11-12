import { EmptyState, Icon, type IconName, Tag } from '@itclabs/react-ui';
import type { OverviewLink, OverviewTodo, OverviewTodoKind } from '@stay/shared';
import { Link } from 'react-router-dom';
import { displayDate, formatVnd } from '@/libraries/format';
import { displayPeriod } from '@/modules/invoices/invoice-ui';

type TodoCopy = {
  icon: IconName;
  title: (todo: OverviewTodo) => string;
  detail: (todo: OverviewTodo) => string;
};

const periodOf = (link: OverviewLink) => displayPeriod(link.query.period ?? '');

/** ` · {label} dd/MM/yyyy` when the step has a calendar date. */
const dated = (todo: OverviewTodo, label: string) =>
  todo.dueOn ? ` · ${label} ${displayDate(todo.dueOn)}` : '';

const COPY: Record<OverviewTodoKind, TodoCopy> = {
  readings: {
    icon: 'bolt',
    title: (todo) => `Chốt số điện nước tiêu thụ tháng ${periodOf(todo.link)}`,
    detail: (todo) =>
      `Còn ${todo.count}/${todo.total ?? todo.count} phòng${dated(todo, 'chốt ngày')}`,
  },
  invoices_to_create: {
    icon: 'receipt',
    title: (todo) => `Lập hoá đơn kỳ ${periodOf(todo.link)}`,
    detail: (todo) => `${todo.count} hợp đồng chưa có hoá đơn${dated(todo, 'phát hành')}`,
  },
  draft_invoices: {
    icon: 'edit',
    title: (todo) => `Phát hành hoá đơn nháp kỳ ${periodOf(todo.link)}`,
    detail: (todo) => `Còn ${todo.count} bản nháp`,
  },
  unshared_invoices: {
    icon: 'mail',
    title: (todo) => `Gửi link hoá đơn kỳ ${periodOf(todo.link)}`,
    detail: (todo) => `${todo.count} hoá đơn chưa gửi link`,
  },
  overdue_invoices: {
    icon: 'moneyTime',
    title: () => 'Hoá đơn quá hạn',
    detail: (todo) => `${todo.count} hoá đơn · ${formatVnd(todo.amount ?? 0)}`,
  },
  expiring_contracts: {
    icon: 'calendar',
    title: () => 'Hợp đồng hết hạn trong 30 ngày',
    detail: (todo) => `${todo.count} hợp đồng`,
  },
  ending_contracts: {
    icon: 'logout',
    title: () => 'Người đã báo trả phòng',
    detail: (todo) => `${todo.count} hợp đồng`,
  },
};

export function todoHref(link: OverviewLink): string {
  const search = new URLSearchParams(link.query).toString();

  return search ? `${link.path}?${search}` : link.path;
}

/** "Việc cần làm" in monthly calendar order; finished items (count 0) are hidden. */
export function TodoList({ todos }: { todos: OverviewTodo[] }) {
  const open = todos.filter((todo) => todo.count > 0);

  return (
    <section aria-labelledby="overview-todo-title" className="grid min-w-0 gap-3">
      <h2 id="overview-todo-title" className="text-section font-semibold text-ink">
        Việc cần làm
      </h2>
      {open.length === 0 ? (
        <EmptyState
          size="compact"
          appearance="plain"
          title={<>Không có việc cần làm.</>}
          data-testid="overview-todo-empty"
        />
      ) : (
        <ol className="grid min-w-0 gap-2" data-testid="overview-todos">
          {open.map((todo) => {
            const copy = COPY[todo.kind];
            const title = copy.title(todo);
            const detail = copy.detail(todo);

            return (
              <li key={todo.kind} className="min-w-0">
                <Link
                  to={todoHref(todo.link)}
                  aria-label={`${title}: ${detail}`}
                  data-testid={`overview-todo-${todo.kind}`}
                  data-count={todo.count}
                  className="flex min-w-0 items-center gap-3 rounded-panel border border-line bg-surface p-3 transition-colors hover:bg-hover"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-50 text-accent">
                    <Icon name={copy.icon} className="size-5" aria-hidden />
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="font-semibold text-ink">{title}</span>
                    <span className="text-ui-sm text-muted">{detail}</span>
                  </span>
                  <Tag tone="brand" aria-hidden>
                    {todo.count}
                  </Tag>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
