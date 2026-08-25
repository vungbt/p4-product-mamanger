import type { ComponentType, ReactNode } from 'react';
import * as ReactPaginateModule from 'react-paginate';
import { cn } from '../../helpers/utils';
import { RenderIcon } from '../icons';

// `react-paginate`'s dist bundle is UMD/CJS wrapped as a fake ES module
// (`{ __esModule: true, default: Component }`). Depending on how a bundler's CJS→ESM
// interop resolves that shape, `import ReactPaginate from 'react-paginate'` can come back
// as that wrapper object itself instead of the component — which is exactly the "Element
// type is invalid ... got: object" error Storybook's Vite build hits. Unwrap defensively and
// recursively (some interop paths nest the wrapper more than once) until we hit something
// invokable (a function/class, or a React special object like memo/forwardRef with $$typeof).
// This is a no-op when the import already resolved correctly (e.g. in apps/web's Vite setup).
const resolveReactPaginate = (mod: unknown): ComponentType<any> => {
  let candidate = mod as any;
  while (
    candidate &&
    typeof candidate !== 'function' &&
    typeof candidate.$$typeof === 'undefined' &&
    'default' in candidate
  ) {
    candidate = candidate.default;
  }
  return candidate as ComponentType<any>;
};

const ReactPaginate = resolveReactPaginate(ReactPaginateModule);

type PaginationProps = {
  limit: number;
  page: number;
  pageCount?: number;
  total: number;
  className?: string;
  customClasses?: {
    root?: string;
    container?: string;
    page?: string;
    active?: string;
    next?: string;
    previous?: string;
  };
  onChangePage: (value: number) => void;
};

// Per docs/design/p4-product-manager-design.html: a page-number cell is 34x34 rounded 8px (not a pill),
// active = solid `primary` background/white text/700 (not `primary-hover`), a regular number has a
// `neutral-border` border/600 text. Prev/Next use a single chevron (not double-chevron), color changes
// by state: disabled = `neutral` text (very light gray) on white, enabled = `secondary` text.
export const Pagination = ({
  limit,
  pageCount,
  className,
  page,
  total,
  customClasses,
  onChangePage,
}: PaginationProps): ReactNode => {
  return (
    <div className={cn('flex items-center gap-2 justify-between w-full', customClasses?.root)}>
      <div className="flex items-center text-sm gap-[5px]">
        Showing <span className="font-semibold">{limit * (page - 1)}</span> to{' '}
        <span className="font-semibold">{total < limit * page ? total : limit * page}</span> of{' '}
        <span className="font-semibold">{total}</span> results
      </div>
      <ReactPaginate
        breakLabel="..."
        nextLabel={renderPageFL(true, page === pageCount)}
        previousLabel={renderPageFL(false, page === 1)}
        pageLabelBuilder={(p: number) => renderPage(p)}
        pageCount={pageCount || Math.ceil(total / limit)}
        forcePage={page - 1}
        onPageChange={(event: { selected: number }) => {
          if (event.selected === undefined) return;
          onChangePage(event.selected + 1);
        }}
        pageRangeDisplayed={5}
        renderOnZeroPageCount={null}
        className={cn(className, customClasses?.container)}
        containerClassName={cn(customClasses?.container, 'flex items-center gap-1.5')}
        breakClassName="flex items-center px-1 text-14 text-neutral-placeholder"
        pageClassName={cn(
          customClasses?.page,
          'h-[34px] w-[34px] text-14 font-semibold text-neutral-text-primary transition-colors ease-linear flex items-center justify-center border border-solid border-neutral-border bg-neutral-white rounded-lg hover:bg-primary-background hover:border-primary-hover cursor-pointer',
        )}
        activeClassName={cn(
          customClasses?.active,
          '!border-primary !bg-primary !text-white !font-bold hover:!bg-primary',
        )}
        previousClassName={cn(
          customClasses?.previous,
          'h-[34px] w-[34px] flex items-center justify-center rounded-lg border border-solid border-neutral-border bg-neutral-white text-secondary hover:bg-primary-background hover:border-primary-hover hover:text-primary cursor-pointer',
          {
            '!cursor-not-allowed !text-neutral hover:!bg-neutral-white hover:!border-neutral-border hover:!text-neutral':
              page === 1,
          },
        )}
        nextClassName={cn(
          customClasses?.next,
          'h-[34px] w-[34px] flex items-center justify-center rounded-lg border border-solid border-neutral-border bg-neutral-white text-secondary hover:bg-primary-background hover:border-primary-hover hover:text-primary cursor-pointer',
          {
            '!cursor-not-allowed !text-neutral hover:!bg-neutral-white hover:!border-neutral-border hover:!text-neutral':
              page === pageCount,
          },
        )}
      />
    </div>
  );
};

const renderPageFL = (isNext = true, disabled = false): ReactNode => (
  <div className={cn('flex items-center justify-center', { 'cursor-not-allowed': disabled })}>
    <RenderIcon
      strokeWidth={2}
      name={isNext ? 'chevron-right' : 'chevron-left'}
      className="!h-[15px] !w-[15px]"
    />
  </div>
);

const renderPage = (page: number): ReactNode => (
  <span className="flex h-full w-full items-center justify-center">{page}</span>
);
