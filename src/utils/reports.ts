import maxBy from "lodash/maxBy";
import startCase from "lodash/startCase";
import sumBy from "lodash/sumBy";

import { consumables } from "@/mocks/consumables";
import { containerCounts, containerHoldings } from "@/mocks/containers";
import { customers } from "@/mocks/customers";
import { drawerSessions } from "@/mocks/drawerSessions";
import { expenses } from "@/mocks/expenses";
import { installments, loans } from "@/mocks/loans";
import { maintenanceLogs } from "@/mocks/maintenance";
import { meterReadings } from "@/mocks/meterReadings";
import { payLines, payRuns } from "@/mocks/payroll";
import { shortages } from "@/mocks/shortages";
import { deliveries, trips } from "@/mocks/trips";
import { waterReadings } from "@/mocks/waterQuality";
import { walkInSales } from "@/mocks/walkInSales";
import type { TLoan, TReportSummary, TReportTable } from "@/types";

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

function salesTotal() {
  return sumBy(deliveries, "amount") + sumBy(walkInSales, "amount");
}

function loanBalance(loan: TLoan) {
  const paid = sumBy(
    installments.filter((installment) => installment.loanId === loan.id && installment.paid),
    "principalPart"
  );

  return loan.status === "released" || loan.status === "paid" ? Math.max(0, loan.principal - paid) : loan.principal;
}

function maintenanceStates() {
  const latestMeterLiters = Math.max(...meterReadings.map((reading) => reading.liters));

  return consumables
    .filter((consumable) => consumable.kind === "maintenance")
    .map((consumable) => ({ consumable, state: computeMaintenanceState(consumable, maintenanceLogs, latestMeterLiters) }));
}

export function buildReportTable(slug: string): TReportTable {
  const employeeStore = useEmployeeStore();
  const customerStore = useCustomerStore();

  switch (slug) {
    case "rider-reconciliation":
      return {
        columns: [
          { key: "rider", label: "Rider" },
          { key: "status", label: "Status" },
          { key: "loaded", label: "Loaded" },
          { key: "delivered", label: "Delivered" },
          { key: "returnedFull", label: "Returned full" },
          { key: "returnedEmpty", label: "Returned empty" },
          { key: "expectedCash", label: "Expected cash", align: "right" },
          { key: "cashRemitted", label: "Cash remitted", align: "right" },
          { key: "cashVariance", label: "Cash variance", align: "right" },
        ],
        rows: trips.map((trip) => {
          const summary = tripSummary(trip.id);

          return {
            rider: employeeStore.employeeName(trip.riderId),
            status: TRIP_STATUS_LABEL[trip.status],
            loaded: summary.loaded,
            delivered: summary.delivered,
            returnedFull: summary.returnedFull,
            returnedEmpty: summary.returnedEmpty,
            expectedCash: formatMoney(summary.expectedCash),
            cashRemitted: formatMoney(summary.cashRemitted),
            cashVariance: formatMoney(summary.cashVariance),
            _date: trip.loadedAt,
          };
        }),
      };

    case "shortages":
      return {
        columns: [
          { key: "employee", label: "Employee" },
          { key: "source", label: "Source" },
          { key: "cash", label: "Cash", align: "right" },
          { key: "containers", label: "Containers", align: "right" },
          { key: "approved", label: "Approved for deduction" },
        ],
        rows: shortages.map((shortage) => ({
          employee: employeeStore.employeeName(shortage.employeeId),
          source: startCase(shortage.source),
          cash: formatMoney(shortage.cash),
          containers: shortage.containers,
          approved: shortage.approvedForDeduction ? "Yes" : "No",
        })),
      };

    case "cashier-variance":
      return {
        columns: [
          { key: "cashier", label: "Cashier" },
          { key: "opened", label: "Opened" },
          { key: "opening", label: "Opening", align: "right" },
          { key: "counted", label: "Counted", align: "right" },
          { key: "variance", label: "Variance", align: "right" },
        ],
        rows: drawerSessions.map((session) => ({
          cashier: employeeStore.employeeName(session.cashierId),
          opened: formatDate(session.openedAt),
          opening: formatMoney(session.openingCash),
          counted: session.countedCash !== undefined ? formatMoney(session.countedCash) : "Open",
          variance: session.countedCash !== undefined ? formatMoney(session.countedCash - session.openingCash) : "-",
          _date: session.openedAt,
        })),
      };

    case "sales": {
      const deliveryRows = deliveries.map((delivery) => ({
        date: formatDateTime(delivery.createdAt),
        type: "Delivery",
        customer: customerStore.customerName(delivery.customerId),
        amount: formatMoney(delivery.amount),
        payment: PAYMENT_LABEL[delivery.paymentType],
        _date: delivery.createdAt,
      }));

      const walkInRows = walkInSales.map((sale) => ({
        date: formatDateTime(sale.createdAt),
        type: "Walk-in",
        customer: sale.customerId ? customerStore.customerName(sale.customerId) : "Walk-in customer",
        amount: formatMoney(sale.amount),
        payment: PAYMENT_LABEL[sale.paymentType],
        _date: sale.createdAt,
      }));

      return {
        columns: [
          { key: "date", label: "Date" },
          { key: "type", label: "Type" },
          { key: "customer", label: "Customer" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "payment", label: "Payment" },
        ],
        rows: [...deliveryRows, ...walkInRows].sort((a, b) => b._date.localeCompare(a._date)),
      };
    }

    case "credit-aging":
      return {
        columns: [
          { key: "customer", label: "Customer" },
          { key: "bucket", label: "Bucket" },
          { key: "balance", label: "Balance", align: "right" },
        ],
        rows: customers
          .filter((customer) => customer.creditBalance > 0)
          .map((customer) => ({
            customer: customer.name,
            bucket: AGING_LABEL[customer.agingBucket],
            balance: formatMoney(customer.creditBalance),
          })),
      };

    case "containers-held":
      return {
        columns: [
          { key: "location", label: "Location" },
          { key: "type", label: "Type" },
          { key: "full", label: "Full", align: "right" },
          { key: "empty", label: "Empty", align: "right" },
        ],
        rows: containerHoldings.map((holding) => ({ location: holding.locationLabel, type: holding.type, full: holding.full, empty: holding.empty })),
      };

    case "container-count-variance":
      return {
        columns: [
          { key: "date", label: "Date" },
          { key: "type", label: "Type" },
          { key: "counted", label: "Counted", align: "right" },
          { key: "expected", label: "Expected", align: "right" },
          { key: "variance", label: "Variance", align: "right" },
        ],
        rows: containerCounts.map((count) => ({
          date: formatDate(count.date),
          type: count.type,
          counted: count.full + count.empty,
          expected: count.expected,
          variance: count.full + count.empty - count.expected,
          _date: count.date,
        })),
      };

    case "stock-reorder":
      return {
        columns: [
          { key: "item", label: "Item" },
          { key: "onHand", label: "On hand", align: "right" },
          { key: "reorderLevel", label: "Reorder level", align: "right" },
          { key: "status", label: "Status" },
        ],
        rows: consumables.map((consumable) => ({
          item: consumable.name,
          onHand: `${consumable.onHand} ${consumable.unit}`,
          reorderLevel: `${consumable.reorderLevel} ${consumable.unit}`,
          status: consumable.onHand <= consumable.reorderLevel ? "Reorder" : "OK",
        })),
      };

    case "maintenance-due":
      return {
        columns: [
          { key: "item", label: "Item" },
          { key: "lastReplaced", label: "Last replaced" },
          { key: "litersSince", label: "Liters since", align: "right" },
          { key: "status", label: "Status" },
        ],
        rows: maintenanceStates().map(({ consumable, state }) => ({
          item: consumable.name,
          lastReplaced: state.lastReplacedAt ? formatDate(state.lastReplacedAt) : "Never",
          litersSince: state.litersSince ?? "-",
          status: startCase(state.status),
        })),
      };

    case "water-quality":
      return {
        columns: [
          { key: "date", label: "Date" },
          { key: "tds", label: "TDS", align: "right" },
          { key: "ph", label: "pH", align: "right" },
          { key: "by", label: "Logged by" },
        ],
        rows: waterReadings.map((reading) => ({
          date: formatDateTime(reading.at),
          tds: reading.tds,
          ph: reading.ph ?? "-",
          by: employeeStore.employeeName(reading.by),
          _date: reading.at,
        })),
      };

    case "expenses":
      return {
        columns: [
          { key: "date", label: "Date" },
          { key: "category", label: "Category" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "paidBy", label: "Paid by" },
          { key: "source", label: "Source" },
        ],
        rows: expenses.map((expense) => ({
          date: formatDate(expense.date),
          category: expense.category,
          amount: formatMoney(expense.amount),
          paidBy: employeeStore.employeeName(expense.paidBy),
          source: startCase(expense.source),
          _date: expense.date,
        })),
      };

    case "payroll-summary":
      return {
        columns: [
          { key: "period", label: "Period" },
          { key: "employee", label: "Employee" },
          { key: "base", label: "Base", align: "right" },
          { key: "incentive", label: "Incentive", align: "right" },
          { key: "deductions", label: "Deductions", align: "right" },
          { key: "net", label: "Net", align: "right" },
        ],
        rows: payLines.map((line) => {
          const run = payRuns.find((candidate) => candidate.id === line.runId);

          return {
            period: run ? formatPeriod(run.periodStart, run.periodEnd) : line.runId,
            employee: employeeStore.employeeName(line.employeeId),
            base: formatMoney(line.base),
            incentive: formatMoney(line.incentive),
            deductions: formatMoney(totalDeductions(line)),
            net: formatMoney(line.net),
            _date: run?.periodStart,
          };
        }),
      };

    case "loan-balances":
      return {
        columns: [
          { key: "employee", label: "Employee" },
          { key: "type", label: "Type" },
          { key: "principal", label: "Principal", align: "right" },
          { key: "status", label: "Status" },
          { key: "balance", label: "Balance", align: "right" },
        ],
        rows: loans.map((loan) => ({
          employee: employeeStore.employeeName(loan.employeeId),
          type: startCase(loan.type),
          principal: formatMoney(loan.principal),
          status: LOAN_STATUS_LABEL[loan.status],
          balance: formatMoney(loanBalance(loan)),
        })),
      };

    case "monthly-profit": {
      const sales = salesTotal();
      const expensesTotal = sumBy(expenses, "amount");

      return {
        columns: [
          { key: "month", label: "Month" },
          { key: "sales", label: "Sales", align: "right" },
          { key: "expenses", label: "Expenses", align: "right" },
          { key: "profit", label: "Profit", align: "right" },
        ],
        rows: [{ month: "September 2026", sales: formatMoney(sales), expenses: formatMoney(expensesTotal), profit: formatMoney(sales - expensesTotal) }],
      };
    }

    default:
      return { columns: [{ key: "note", label: "Note" }], rows: [{ note: "No detailed report configured yet for this type." }] };
  }
}
