export function formatVariance(value: number, isMoney = false) {
  if (value === 0) {
    return "Matches";
  }

  if (!isMoney) {
    return `${value} off`;
  }

  return value > 0 ? `Over ${formatMoney(value)}` : `Short ${formatMoney(Math.abs(value))}`;
}
