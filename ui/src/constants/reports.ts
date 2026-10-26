import maxBy from "lodash/maxBy";
import sumBy from "lodash/sumBy";

import { consumables } from "@/mocks/consumables";
import { containerCounts, containerHoldings } from "@/mocks/containers";
import { customers } from "@/mocks/customers";
import { drawerSessions } from "@/mocks/drawerSessions";
import { expenses } from "@/mocks/expenses";
import { loans } from "@/mocks/loans";
import { payLines } from "@/mocks/payroll";
import { shortages } from "@/mocks/shortages";
import { deliveries, trips } from "@/mocks/trips";
import { waterReadings } from "@/mocks/waterQuality";
import { walkInSales } from "@/mocks/walkInSales";
import type { TReportSummary } from "@/types";

export const REPORTS: { slug: string; title: string; description: string; summary: () => TReportSummary }[] = [
  {
    slug: "rider-reconciliation",
    title: "Rider reconciliation",
    description: "Loaded, delivered, returned and cash per trip",
    summary: () => {
      const variance = sumBy(trips, (trip) => tripSummary(trip.id).cashVariance);

      return { value: formatMoney(variance), hint: "Cash variance", tone: variance !== 0 ? "warn" : "default" };
    },
  },
  {
    slug: "shortages",
    title: "Rider & cashier shortages",
    description: "Employee, source, cash, containers and whether approved for deduction",
    summary: () => {
      const pending = shortages.filter((shortage) => !shortage.approvedForDeduction).length;

      return { value: String(pending), hint: "Pending review", tone: pending > 0 ? "warn" : "default" };
    },
  },
  {
    slug: "cashier-variance",
    title: "Cashier variance",
    description: "Drawer sessions and cash variance per cashier",
    summary: () => {
      const variance = sumBy(drawerSessions, (session) => (session.countedCash !== undefined ? session.countedCash - session.openingCash : 0));

      return { value: formatMoney(variance), hint: "Closed sessions", tone: variance !== 0 ? "warn" : "default" };
    },
  },
  {
    slug: "sales",
    title: "Sales",
    description: "Deliveries and walk-in sales",
    summary: () => ({ value: formatMoney(salesTotal()), hint: `${deliveries.length + walkInSales.length} transactions` }),
  },
  {
    slug: "credit-aging",
    title: "Credit aging",
    description: "Customer balances by aging bucket",
    summary: () => {
      const owing = customers.filter((customer) => customer.creditBalance > 0);

      return { value: formatMoney(sumBy(owing, "creditBalance")), hint: `${owing.length} customers` };
    },
  },
  {
    slug: "containers-held",
    title: "Containers held",
    description: "Holdings by station, rider and customer",
    summary: () => ({ value: String(sumBy(containerHoldings, (holding) => holding.full + holding.empty)), hint: "Full and empty" }),
  },
  {
    slug: "container-count-variance",
    title: "Container count variance",
    description: "Daily counts against expected",
    summary: () => {
      const off = containerCounts.filter((count) => count.full + count.empty !== count.expected).length;

      return { value: String(off), hint: "Counts off expected", tone: off > 0 ? "warn" : "default" };
    },
  },
  {
    slug: "stock-reorder",
    title: "Stock and reorder",
    description: "Consumables on hand against reorder levels",
    summary: () => {
      const low = consumables.filter((consumable) => consumable.onHand <= consumable.reorderLevel).length;

      return { value: String(low), hint: "To reorder", tone: low > 0 ? "warn" : "default" };
    },
  },
  {
    slug: "maintenance-due",
    title: "Maintenance due",
    description: "Filters, membrane and UV lamp due or overdue",
    summary: () => {
      const due = maintenanceStates().filter(({ state }) => state.status !== "ok").length;

      return { value: String(due), hint: "Due or overdue", tone: due > 0 ? "warn" : "default" };
    },
  },
  {
    slug: "water-quality",
    title: "Water quality",
    description: "TDS and pH readings",
    summary: () => {
      const latest = maxBy(waterReadings, "at");

      return { value: latest ? `${latest.tds} ppm` : "-", hint: "Latest TDS" };
    },
  },
  {
    slug: "expenses",
    title: "Expenses",
    description: "All recorded expenses",
    summary: () => ({ value: formatMoney(sumBy(expenses, "amount")), hint: `${expenses.length} entries` }),
  },
  {
    slug: "payroll-summary",
    title: "Payroll summary",
    description: "Pay lines by run and employee",
    summary: () => ({ value: formatMoney(sumBy(payLines, "net")), hint: "Total net pay" }),
  },
  {
    slug: "loan-balances",
    title: "Loan balances",
    description: "Outstanding loans and advances",
    summary: () => ({ value: formatMoney(sumBy(loans, loanBalance)), hint: "Outstanding" }),
  },
  {
    slug: "monthly-profit",
    title: "Monthly profit",
    description: "Sales minus expenses",
    summary: () => {
      const profit = salesTotal() - sumBy(expenses, "amount");

      return { value: formatMoney(profit), hint: "September 2026", tone: profit < 0 ? "warn" : "default" };
    },
  },
];
