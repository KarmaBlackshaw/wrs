// ponytail: fixed ids so UI mocks and Dexie caches stay stable across reseeds.
export const id = (group: number, n: number) => `00000000-0000-4000-8000-${String(group).padStart(4, "0")}${String(n).padStart(8, "0")}`;

export const EMPLOYEE = {
  owner: id(1, 1),
  cashier: id(1, 2),
  rider1: id(1, 3),
  rider2: id(1, 4),
  washer: id(1, 5),
  multi: id(1, 6),
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
