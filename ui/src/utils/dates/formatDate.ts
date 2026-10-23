export function formatDate(input: string | number | Date) {
  return toManila(input).format("D MMM YYYY");
}
