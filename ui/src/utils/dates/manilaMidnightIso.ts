import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export function manilaMidnightIso(date: string) {
  return dayjs.tz(date, "Asia/Manila").startOf("day").toISOString();
}
