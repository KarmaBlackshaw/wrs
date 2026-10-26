export const ROUTES = {
  LOGIN: "/login",

  RIDER: {
    INDEX: "/rider",
    CUSTOMERS: "/rider/customers",
    CUSTOMERS_ALL: "/rider/customers/all",
    TRIP_RETURN: (tripId: string) => `/rider/trip/${tripId}/return`,
    DELIVER: (tripId: string, customerId?: string) => `/rider/trip/${tripId}/deliver${customerId ? `/${customerId}` : ""}`,
  },

  CASHIER: {
    INDEX: "/cashier",
    SELL: "/cashier/sell",
    COLLECT: "/cashier/collect",
    RETURN_CONTAINER: "/cashier/return-container",
    TRIPS: {
      INDEX: "/cashier/trips",
      NEW: "/cashier/trips/new",
      RECEIVE: (tripId: string) => `/cashier/trips/${tripId}/receive`,
      RECONCILE: (tripId: string) => `/cashier/trips/${tripId}/reconcile`,
    },
    COUNT: "/cashier/count",
    STOCK: "/cashier/stock",
  },

  STAFF: {
    LOGS: "/staff/logs",
  },

  ME: {
    INDEX: "/me",
    PAYSLIP: (payslipId: string) => `/me/payslips/${payslipId}`,
  },

  OWNER: {
    INDEX: "/owner",
    APPROVALS: "/owner/approvals",
    APPROVALS_HANDLED: "/owner/approvals/handled",
    SALES: "/owner/sales",
    TRIPS: "/owner/trips",
    CUSTOMERS: {
      INDEX: "/owner/customers",
      DETAIL: (customerId: string) => `/owner/customers/${customerId}`,
    },
    CONTAINERS: {
      INDEX: "/owner/containers",
      MOVEMENTS: "/owner/containers/movements",
      COUNTS: "/owner/containers/counts",
    },
    INVENTORY: {
      INDEX: "/owner/inventory",
      CONSUMABLES: "/owner/inventory/consumables",
      MAINTENANCE: "/owner/inventory/maintenance",
      WATER_QUALITY: "/owner/inventory/water-quality",
    },
    MONEY: {
      INDEX: "/owner/money",
      EXPENSES: "/owner/money/expenses",
      CASH_SESSIONS: "/owner/money/cash-sessions",
    },
    PEOPLE: {
      INDEX: "/owner/people",
      EMPLOYEE: (employeeId: string) => `/owner/people/employees/${employeeId}`,
      PAYROLL: {
        INDEX: "/owner/people/payroll",
        RUN: (runId: string) => `/owner/people/payroll/${runId}`,
      },
      LOANS: "/owner/people/loans",
    },
    REPORTS: "/owner/reports",
    REPORT: (report: string) => `/owner/reports/${report}`,
    DIGEST: "/owner/reports/digest",
    SETTINGS: {
      INDEX: "/owner/settings",
      LOANS: "/owner/settings/loans",
      CONTAINERS_CREDIT: "/owner/settings/containers-credit",
      WATER_QUALITY: "/owner/settings/water-quality",
      DIGEST: "/owner/settings/digest",
    },
  },
} as const;

export type TRiderCustomerScope = "mine" | "all";

export const RIDER_TABS = {
  CUSTOMERS: [
    { label: "Mine", to: ROUTES.RIDER.CUSTOMERS },
    { label: "All", to: ROUTES.RIDER.CUSTOMERS_ALL },
  ],
};

export const OWNER_TABS = {
  APPROVALS: [
    { label: "Pending", to: ROUTES.OWNER.APPROVALS },
    { label: "Handled", to: ROUTES.OWNER.APPROVALS_HANDLED },
  ],
  CONTAINERS: [
    { label: "Holdings", to: ROUTES.OWNER.CONTAINERS.INDEX },
    { label: "Movement log", to: ROUTES.OWNER.CONTAINERS.MOVEMENTS },
    { label: "Count variances", to: ROUTES.OWNER.CONTAINERS.COUNTS },
  ],
  INVENTORY: [
    { label: "Products & prices", to: ROUTES.OWNER.INVENTORY.INDEX },
    { label: "Consumables", to: ROUTES.OWNER.INVENTORY.CONSUMABLES },
    { label: "Maintenance", to: ROUTES.OWNER.INVENTORY.MAINTENANCE },
    { label: "Water quality", to: ROUTES.OWNER.INVENTORY.WATER_QUALITY },
  ],
  MONEY: [
    { label: "Credit aging", to: ROUTES.OWNER.MONEY.INDEX },
    { label: "Expenses", to: ROUTES.OWNER.MONEY.EXPENSES },
    { label: "Cash sessions", to: ROUTES.OWNER.MONEY.CASH_SESSIONS },
  ],
  PEOPLE: [
    { label: "Employees", to: ROUTES.OWNER.PEOPLE.INDEX },
    { label: "Payroll", to: ROUTES.OWNER.PEOPLE.PAYROLL.INDEX },
    { label: "Loans", to: ROUTES.OWNER.PEOPLE.LOANS },
  ],
  SETTINGS: [
    { label: "Riders & pay", to: ROUTES.OWNER.SETTINGS.INDEX },
    { label: "Loans", to: ROUTES.OWNER.SETTINGS.LOANS },
    { label: "Containers & credit", to: ROUTES.OWNER.SETTINGS.CONTAINERS_CREDIT },
    { label: "Water quality", to: ROUTES.OWNER.SETTINGS.WATER_QUALITY },
    { label: "Digest", to: ROUTES.OWNER.SETTINGS.DIGEST },
  ],
};
