import type { Knex } from "knex";
import type { TPage } from "@wrs/contract/common";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export async function paginate<T>(
  query: Knex.QueryBuilder,
  { page = 1, pageSize = DEFAULT_PAGE_SIZE }: { page?: number; pageSize?: number }
): Promise<TPage<T>> {
  const size = Math.min(pageSize, MAX_PAGE_SIZE);

  const counted = await query.client.queryBuilder().count({ total: "*" }).from(query.clone().clearOrder().as("q"));

  const items: T[] = await query
    .clone()
    .offset((page - 1) * size)
    .limit(size);

  return { items, total: Number(counted[0]?.total ?? 0), page, pageSize: size };
}
