// ponytail: settings["water.tdsAcceptableRangePpm"] is null until go-live; swap 40 for the setting once it carries a real value.
export function isTdsOutOfRange(tds: number) {
  return tds > 40;
}
