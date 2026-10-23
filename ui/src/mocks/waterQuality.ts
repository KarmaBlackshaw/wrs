import type { TLabTest, TWaterReading } from "@/types";

export const waterReadings: TWaterReading[] = [
  { id: "water-1", tds: 18, ph: 7.1, at: "2026-09-25T06:30:00+08:00", by: "emp-5" },
  { id: "water-2", tds: 20, ph: 7.0, at: "2026-09-26T06:30:00+08:00", by: "emp-5" },
  { id: "water-3", tds: 45, at: "2026-09-27T06:30:00+08:00", by: "emp-6" },
];

export const labTests: TLabTest[] = [
  { id: "lab-1", type: "Physical & Chemical", date: "2026-06-01", result: "Passed", fileUrl: "/mocks/lab-2026-06.pdf", nextDue: "2026-12-01" },
  { id: "lab-2", type: "Bacteriological", date: "2026-08-01", result: "Passed", fileUrl: "/mocks/lab-2026-08.pdf", nextDue: "2026-11-01" },
];
