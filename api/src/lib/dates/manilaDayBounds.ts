const DAY_MS = 24 * 60 * 60 * 1000;

export function manilaDayBounds(date: string): { start: Date; end: Date } {
  const start = new Date(`${date}T00:00:00+08:00`);

  return { start, end: new Date(start.getTime() + DAY_MS) };
}
