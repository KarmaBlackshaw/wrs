import type { TDelivery, TTrip, TTripLine } from "@/types";

export const trips: TTrip[] = [
  {
    id: "trip-1",
    riderId: "emp-3",
    status: "reconciled",
    loadedAt: "2026-09-25T05:30:00+08:00",
    returnedAt: "2026-09-25T16:00:00+08:00",
    cashRemitted: 450000,
  },
  { id: "trip-2", riderId: "emp-4", status: "returned", loadedAt: "2026-09-26T05:30:00+08:00", returnedAt: "2026-09-26T16:15:00+08:00", cashRemitted: 380000 },
  { id: "trip-3", riderId: "emp-3", status: "open", loadedAt: "2026-09-27T05:45:00+08:00" },
];

export const tripLines: TTripLine[] = [
  { tripId: "trip-1", productId: "prod-1", loaded: 40, returnedFull: 4, returnedEmpty: 0 },
  { tripId: "trip-2", productId: "prod-1", loaded: 35, returnedFull: 3, returnedEmpty: 0 },
  { tripId: "trip-3", productId: "prod-1", loaded: 30, returnedFull: 0, returnedEmpty: 0 },
];

export const deliveries: TDelivery[] = [
  {
    id: "del-1",
    tripId: "trip-1",
    customerId: "cust-1",
    productId: "prod-1",
    delivered: 2,
    emptiesCollected: 2,
    amount: 7000,
    paymentType: "cash",
    depositCollected: 0,
    createdAt: "2026-09-25T07:15:00+08:00",
  },
  {
    id: "del-2",
    tripId: "trip-1",
    customerId: "cust-2",
    productId: "prod-1",
    delivered: 3,
    emptiesCollected: 3,
    amount: 10500,
    paymentType: "credit",
    depositCollected: 0,
    createdAt: "2026-09-25T07:45:00+08:00",
  },
  {
    id: "del-3",
    tripId: "trip-2",
    customerId: "cust-4",
    productId: "prod-1",
    delivered: 2,
    emptiesCollected: 1,
    amount: 7000,
    paymentType: "e-wallet",
    depositCollected: 20000,
    createdAt: "2026-09-26T08:05:00+08:00",
  },
];
