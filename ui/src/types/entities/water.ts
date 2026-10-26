export type TWaterReading = {
  id: string;
  tds: number;
  ph?: number;
  at: string;
  by: string;
};

export type TLabTest = {
  id: string;
  type: string;
  date: string;
  result: string;
  fileUrl: string;
  nextDue: string;
};
