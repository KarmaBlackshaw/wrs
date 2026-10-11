export function formatDateTime(input: string | number | Date) {
  return toManila(input).format("D MMM YYYY, h:mm A");
}
