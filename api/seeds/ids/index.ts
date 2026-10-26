export const id = (group: number, n: number) => `00000000-0000-4000-8000-${String(group).padStart(4, "0")}${String(n).padStart(8, "0")}`;

export const EMPLOYEE = {
  owner: id(1, 1),
  cashier: id(1, 2),
  rider1: id(1, 3),
  rider2: id(1, 4),
  washer: id(1, 5),
  helper: id(1, 6),
  multi: id(1, 7),
};

export const PRODUCT = {
  roundRefill: id(4, 1),
  slimRefill: id(4, 2),
  roundContainer: id(4, 3),
  slimContainer: id(4, 4),
  bottled: id(4, 5),
  ice: id(4, 6),
};

export const CONSUMABLE = {
  cap: id(5, 1),
  seal: id(5, 2),
  sedimentFilter: id(5, 3),
  carbonFilter: id(5, 4),
  roMembrane: id(5, 5),
  uvLamp: id(5, 6),
  sanitizer: id(5, 7),
};

export const ID_GROUP = {
  employee: 1,
  payPlan: 2,
  customer: 3,
  product: 4,
  consumable: 5,
  stockEntry: 6,
  containerMovement: 7,
  expenseCategory: 8,
  price: 9,
  containerCount: 10,
  drawerSession: 11,
  trip: 12,
  delivery: 13,
  customerOwnership: 14,
  walkInSale: 15,
  payment: 16,
  depositEntry: 17,
  expense: 18,
  meterReading: 19,
  waterReading: 20,
  labTest: 21,
  maintenanceLog: 22,
  loan: 23,
  installment: 24,
  void: 25,
  voidRefund: 26,
  shortage: 27,
  absence: 28,
  payRun: 29,
  payLine: 30,
  payLineAdjustment: 31,
  approvalRequest: 32,
  syncConflict: 33,
  file: 34,
  clientOp: 35,
} as const;

function mockIds(prefix: string, group: number, { from = 1, to, offset = 0 }: { from?: number; to: number; offset?: number }) {
  return Object.fromEntries(Array.from({ length: to - from + 1 }, (_, i) => [`${prefix}-${from + i}`, id(group, from + i + offset)]));
}

export const MOCK_ID: Record<string, string> = {
  ...mockIds("emp", ID_GROUP.employee, { to: 7 }),
  ...mockIds("cust", ID_GROUP.customer, { to: 15 }),
  ...mockIds("prod", ID_GROUP.product, { to: 6 }),
  "cons-1": CONSUMABLE.cap,
  "cons-2": CONSUMABLE.seal,
  "cons-3": CONSUMABLE.sedimentFilter,
  "cons-4": CONSUMABLE.roMembrane,
  "cons-5": CONSUMABLE.uvLamp,
  "cons-6": CONSUMABLE.sanitizer,
  ...mockIds("stock", ID_GROUP.stockEntry, { to: 3, offset: 7 }),
  ...mockIds("mov", ID_GROUP.containerMovement, { to: 6, offset: 2 }),
  ...mockIds("count", ID_GROUP.containerCount, { to: 3 }),
  ...mockIds("draw", ID_GROUP.drawerSession, { to: 3 }),
  ...mockIds("trip", ID_GROUP.trip, { to: 3 }),
  ...mockIds("del", ID_GROUP.delivery, { to: 3 }),
  ...mockIds("wi", ID_GROUP.walkInSale, { to: 4 }),
  ...mockIds("pay", ID_GROUP.payment, { to: 3 }),
  ...mockIds("dep", ID_GROUP.depositEntry, { to: 4 }),
  ...mockIds("exp", ID_GROUP.expense, { to: 4 }),
  ...mockIds("meter", ID_GROUP.meterReading, { to: 3 }),
  ...mockIds("water", ID_GROUP.waterReading, { to: 3 }),
  ...mockIds("lab", ID_GROUP.labTest, { to: 2 }),
  ...mockIds("maint", ID_GROUP.maintenanceLog, { to: 3 }),
  ...mockIds("loan", ID_GROUP.loan, { to: 5 }),
  ...mockIds("void", ID_GROUP.void, { to: 2 }),
  ...mockIds("short", ID_GROUP.shortage, { to: 2 }),
  ...mockIds("run", ID_GROUP.payRun, { from: 0, to: 2, offset: 1 }),
  ...mockIds("appr", ID_GROUP.approvalRequest, { to: 4 }),
};

export function mulberry32(seed: number) {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
