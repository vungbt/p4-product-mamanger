import { Select, type SelectOption, type SingleSelectProps } from '@itclabs/react-ui';
import { type UseQueryOptions, useQuery } from '@p4/api-client';
import { getErrorMessage } from '@p4/api-sdk/shared';
import { useEffect, useState } from 'react';
import { OPTIONS_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '@/constants/list';

export type RemoteSelectControlProps = Pick<
  SingleSelectProps,
  | 'value'
  | 'onValueChange'
  | 'onBlur'
  | 'error'
  | 'label'
  | 'id'
  | 'name'
  | 'required'
  | 'disabled'
  | 'clearable'
  | 'placeholder'
  | 'size'
  | 'rootClassName'
  | 'classNames'
  | 'aria-label'
>;

export type RemoteSelectPage<Row> = { data: Row[]; meta?: { total: number } };

export type RemoteSelectProps<
  Row,
  Page extends RemoteSelectPage<Row>,
  Detail extends { data: Row },
> = RemoteSelectControlProps & {
  pageOptions: (search: string, page: number, pageSize: number) => UseQueryOptions<Page>;
  selectedOptions: (id: string) => UseQueryOptions<Detail>;
  toOption: (row: Row) => SelectOption;
  loadError: string;
  pageSize?: number;
};

/** Query options own cache keys and fetchers; the kit owns search debouncing. */
export function RemoteSelect<
  Row,
  Page extends RemoteSelectPage<Row>,
  Detail extends { data: Row },
>({
  pageOptions,
  selectedOptions,
  toOption,
  loadError,
  pageSize = OPTIONS_PAGE_SIZE,
  ...props
}: RemoteSelectProps<Row, Page, Detail>) {
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1);

  const [pages, setPages] = useState<Map<number, Row[]>>(() => new Map());

  const query = useQuery(pageOptions(search, page, pageSize));

  const selected = useQuery({
    ...selectedOptions(props.value ?? ''),
    enabled: Boolean(props.value),
  });

  const rows = query.data?.data;

  useEffect(() => {
    if (!rows) return;
    setPages((previous) => {
      const next = page === 1 ? new Map<number, Row[]>() : new Map(previous);
      next.set(page, rows);
      return next;
    });
  }, [rows, page, search]);

  const merged = new Map<string, SelectOption>();
  for (const rows of pages.values()) {
    for (const row of rows) {
      const option = toOption(row);
      merged.set(option.value, option);
    }
  }
  const options = [...merged.values()];

  const failure = query.isError ? query.error : selected.isError ? selected.error : undefined;
  const selectedOption = selected.data
    ? toOption(selected.data.data)
    : options.find((option) => option.value === props.value);

  return (
    <Select
      {...props}
      value={props.value || null}
      options={options}
      selectedOptions={
        props.value ? [selectedOption ?? { value: props.value, label: props.value }] : []
      }
      searchable
      searchMode="server"
      searchDebounceMs={SEARCH_DEBOUNCE_MS}
      onSearchChange={(value) => {
        const next = value.trim();
        if (next === search) return;
        setPages(new Map());
        setPage(1);
        setSearch(next);
      }}
      loading={query.isPending}
      loadingMore={query.isFetching && page > 1}
      hasMore={Boolean(query.data?.meta && page * pageSize < query.data.meta.total)}
      onLoadMore={() => {
        if (!query.isFetching && !query.isError)
          setPage((previous) => (previous === page ? previous + 1 : previous));
      }}
      optionsError={failure ? getErrorMessage(failure, loadError) : undefined}
      onRetryOptions={() => {
        if (query.isError) void query.refetch();
        if (selected.isError) void selected.refetch();
      }}
    />
  );
}
