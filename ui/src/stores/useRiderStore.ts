import type { TCustomer } from "@wrs/contract/customer";
import type { TSyncSnapshot } from "@wrs/contract/sync";

import { openOfflineDb, type TRiderSnapshot } from "@/lib/offlineDb";

const SNAPSHOT_KEY = "rider";

export const useRiderStore = defineStore("rider", () => {
  const auth = useAuthStore();
  const sync = useSyncStore();

  const snapshot = ref<TRiderSnapshot>({ trip: null, customers: [], products: [], containerTypes: [] });
  const isHydrated = ref(false);
  const pulledAt = ref<string>();

  const actor = computed(() => (auth.me != null ? { id: auth.me.id, name: fullName(auth.me) } : undefined));

  const projected = computed(() =>
    sync.outbox.reduce((current, op) => {
      if (op.settledAt != null && pulledAt.value != null && op.settledAt <= pulledAt.value) {
        return current;
      }

      switch (op.kind) {
        case "customer.create":
          return applyCustomerCreate(current, op, actor.value);
        case "customer.release":
          return applyRelease(current, op);
        case "delivery.create":
          return applyDelivery(current, op);
        case "payment.create":
          return applyPayment(current, op);
        case "trip.end":
          return applyTripEnd(current, op);
        case "waiver_request.create":
          return current;
      }
    }, snapshot.value)
  );

  const trip = computed(() => projected.value.trip);
  const allCustomers = computed(() => projected.value.customers);
  const products = computed(() => projected.value.products);
  const containerTypes = computed(() => projected.value.containerTypes);

  const myCustomers = computed(() => {
    const meId = auth.me?.id;
    const today = todayIso();

    return allCustomers.value.filter(
      ({ riderId, coverage }) =>
        meId != null && (riderId === meId || (coverage != null && coverage.coveringRiderId === meId && coverage.from <= today && coverage.until >= today))
    );
  });

  async function hydrate() {
    const db = await openOfflineDb();
    const [record, customers] = await Promise.all([db.get("snapshot", SNAPSHOT_KEY), db.getAll("customers")]);

    snapshot.value = {
      trip: record?.trip ?? null,
      customers,
      products: record?.products ?? [],
      containerTypes: record?.containerTypes ?? [],
    };

    pulledAt.value = record?.syncedAt;

    isHydrated.value = true;
  }

  async function applySnapshot({
    snapshot: { cursor, trip: nextTrip, customers, products: nextProducts, containerTypes: nextContainerTypes },
    requestedAt,
  }: {
    snapshot: TSyncSnapshot;
    requestedAt: string;
  }) {
    const db = await openOfflineDb();
    const tx = db.transaction(["snapshot", "customers"], "readwrite");

    await Promise.all([
      tx.objectStore("snapshot").put({
        key: SNAPSHOT_KEY,
        cursor,
        syncedAt: requestedAt,
        trip: nextTrip,
        products: nextProducts,
        containerTypes: nextContainerTypes,
      }),
      ...customers.map((customer) => tx.objectStore("customers").put(customer)),
      tx.done,
    ]);

    const changed = new Map(customers.map((customer) => [customer.id, customer]));
    const merged = snapshot.value.customers.map((customer) => changed.get(customer.id) ?? customer);
    const known = new Set(merged.map(({ id }) => id));

    snapshot.value = {
      trip: nextTrip,
      customers: [...merged, ...customers.filter(({ id }) => !known.has(id))],
      products: nextProducts,
      containerTypes: nextContainerTypes,
    };

    pulledAt.value = requestedAt;
  }

  function search(query: string) {
    const term = query.trim().toLowerCase();

    if (!term) {
      return allCustomers.value;
    }

    return allCustomers.value.filter((customer) =>
      [fullName(customer), customer.phone, customer.address, customer.riderName ?? ""].some((field) => field.toLowerCase().includes(term))
    );
  }

  function customer(id: string): TCustomer | undefined {
    return allCustomers.value.find((entry) => entry.id === id);
  }

  return { isHydrated, hydrate, applySnapshot, trip, myCustomers, allCustomers, search, customer, products, containerTypes };
});
