import type { TPage } from "@wrs/contract/common";

const PAGE_SIZE = 100;

type TPageQuery = { page: number; pageSize: number };

export const allPages = async <T>(fetchPage: (query: TPageQuery) => Promise<TPage<T>>): Promise<T[]> => {
  const first = await fetchPage({ page: 1, pageSize: PAGE_SIZE });
  const pageCount = Math.ceil(first.total / PAGE_SIZE);

  const rest = await Promise.all(Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => fetchPage({ page: index + 2, pageSize: PAGE_SIZE })));

  return [first, ...rest].flatMap(({ items }) => items);
};
