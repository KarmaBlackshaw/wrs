const manilaDateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" });

export function manilaDate(d: Date): string {
  return manilaDateFormat.format(d);
}
