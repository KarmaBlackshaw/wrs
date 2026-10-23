import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export function toManila(input: string | number | Date) {
  return dayjs(new Date(input)).tz("Asia/Manila");
}
