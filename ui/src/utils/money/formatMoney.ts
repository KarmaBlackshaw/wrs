export function formatMoney(centavos: number) {
  const sign = centavos < 0 ? "-" : "";

  return `${sign}₱${(Math.abs(centavos) / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
