import type { TConsumable, TProductUsage, TStockEntry } from "@/types";

export const consumables: TConsumable[] = [
  { id: "cons-1", name: "Bottle Cap (round)", unit: "pc", kind: "per-unit", reorderLevel: 200, onHand: 850 },
  { id: "cons-2", name: "Bottle Seal (round)", unit: "pc", kind: "per-unit", reorderLevel: 200, onHand: 150 },
  { id: "cons-3", name: "Sediment Filter", unit: "pc", kind: "maintenance", reorderLevel: 2, intervalLiters: 20000, intervalDays: 90, onHand: 3 },
  { id: "cons-4", name: "RO Membrane", unit: "pc", kind: "maintenance", reorderLevel: 1, intervalLiters: 100000, intervalDays: 365, onHand: 1 },
  { id: "cons-5", name: "UV Lamp", unit: "pc", kind: "maintenance", reorderLevel: 1, intervalDays: 180, onHand: 2 },
  { id: "cons-6", name: "Cleaning Alcohol", unit: "L", kind: "general", reorderLevel: 5, onHand: 12 },
];

export const productUsages: TProductUsage[] = [
  { productId: "prod-1", consumableId: "cons-1", qtyPerUnit: 1 },
  { productId: "prod-1", consumableId: "cons-2", qtyPerUnit: 1 },
  { productId: "prod-2", consumableId: "cons-1", qtyPerUnit: 1 },
];

export const stockEntries: TStockEntry[] = [
  { id: "stock-1", consumableId: "cons-2", qty: -50, reason: "Refill deductions", createdAt: "2026-09-26T18:00:00+08:00" },
  { id: "stock-2", consumableId: "cons-2", qty: 500, reason: "Restock from expense", refId: "exp-2", createdAt: "2026-09-20T10:00:00+08:00" },
  { id: "stock-3", consumableId: "cons-6", qty: -1, reason: "Stock-take adjustment", createdAt: "2026-09-24T17:00:00+08:00" },
];
