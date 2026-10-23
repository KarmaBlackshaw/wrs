export function formatTime(input: string | number | Date) {
  return toManila(input).format("h:mm A");
}
