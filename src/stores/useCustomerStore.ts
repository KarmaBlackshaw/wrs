import { customers as mockCustomers } from "@/mocks/customers";

export const useCustomerStore = defineStore("customer", () => {
  const customers = ref(mockCustomers);

  function findCustomer(id: string) {
    return customers.value.find((customer) => customer.id === id);
  }

  function customerName(id: string) {
    return findCustomer(id)?.name ?? "Unknown";
  }

  return { customers, findCustomer, customerName };
});
