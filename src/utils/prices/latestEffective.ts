import maxBy from "lodash/maxBy";

export function latestEffective<T extends { effectiveFrom: string }>(items: T[], onDate = todayIso()) {
  return maxBy(
    items.filter((item) => item.effectiveFrom.slice(0, 10) <= onDate),
    (item) => item.effectiveFrom
  );
}
