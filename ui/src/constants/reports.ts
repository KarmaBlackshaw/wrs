import type { TReportSlug } from "@wrs/contract/report";

export const REPORTS: { slug: TReportSlug; title: string; description: string; hint: string; kind: "money" | "count" | "ppm" }[] = [
  {
    slug: "rider-reconciliation",
    title: "Rider reconciliation",
    description: "Loaded, delivered, returned and cash per trip",
    hint: "Cash variance",
    kind: "money",
  },
  {
    slug: "shortages",
    title: "Rider & cashier shortages",
    description: "Employee, source, cash, containers and status (pending, deducted, excluded, dismissed)",
    hint: "Pending review",
    kind: "count",
  },
  {
    slug: "cashier-variance",
    title: "Cashier variance",
    description: "Drawer sessions and cash variance per cashier",
    hint: "Closed sessions",
    kind: "money",
  },
  { slug: "sales", title: "Sales", description: "Deliveries and walk-in sales", hint: "Total sales", kind: "money" },
  { slug: "credit-aging", title: "Credit aging", description: "Customer balances by aging bucket", hint: "Owed by customers", kind: "money" },
  { slug: "containers-held", title: "Containers held", description: "Holdings by station, rider and customer", hint: "Full and empty", kind: "count" },
  {
    slug: "container-count-variance",
    title: "Container count variance",
    description: "Daily counts against expected",
    hint: "Counts off expected",
    kind: "count",
  },
  { slug: "stock-reorder", title: "Stock and reorder", description: "Consumables on hand against reorder levels", hint: "To reorder", kind: "count" },
  { slug: "maintenance-due", title: "Maintenance due", description: "Filters, membrane and UV lamp due or overdue", hint: "Due or overdue", kind: "count" },
  { slug: "water-quality", title: "Water quality", description: "TDS and pH readings", hint: "Latest TDS", kind: "ppm" },
  { slug: "expenses", title: "Expenses", description: "All recorded expenses", hint: "Total expenses", kind: "money" },
  { slug: "payroll-summary", title: "Payroll summary", description: "Pay lines by run and employee", hint: "Total net pay", kind: "money" },
  { slug: "loan-balances", title: "Loan balances", description: "Outstanding loans and advances", hint: "Outstanding", kind: "money" },
  { slug: "monthly-profit", title: "Monthly profit", description: "Sales minus expenses", hint: "Sales less expenses", kind: "money" },
];
