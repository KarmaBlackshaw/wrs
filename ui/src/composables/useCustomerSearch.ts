import type { MaybeRefOrGetter } from "vue";

import type { TCustomer } from "@/types";

export function useCustomerSearch(query: MaybeRefOrGetter<string>, source?: MaybeRefOrGetter<TCustomer[]>) {
  const customerStore = useCustomerStore();

  return computed(() => {
    const term = toValue(query).trim().toLowerCase();
    const list = toValue(source ?? customerStore.customers);

    if (!term) {
      return list;
    }

    return list.filter(
      (customer) => customer.name.toLowerCase().includes(term) || customer.address.toLowerCase().includes(term) || customer.phone.includes(term)
    );
  });
}
