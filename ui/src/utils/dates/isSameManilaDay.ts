export function isSameManilaDay(a: string | number | Date, b: string | number | Date) {
  return toManila(a).format("YYYY-MM-DD") === toManila(b).format("YYYY-MM-DD");
}
