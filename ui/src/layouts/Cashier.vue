<script setup lang="ts">
import {
  IconCalculator,
  IconCalculatorFill,
  IconCashRegister,
  IconCashRegisterFill,
  IconClipboardText,
  IconClipboardTextFill,
  IconPackage,
  IconPackageFill,
  IconTruck,
  IconTruckFill,
  IconUserCircle,
  IconUserCircleFill,
} from "@/components";
import { ROUTES } from "@/types";

const items = [
  { label: "Sell", to: ROUTES.CASHIER.SELL, icon: IconCashRegister, activeIcon: IconCashRegisterFill },
  { label: "Trips", to: ROUTES.CASHIER.TRIPS.INDEX, icon: IconTruck, activeIcon: IconTruckFill },
  { label: "Count", to: ROUTES.CASHIER.COUNT, icon: IconCalculator, activeIcon: IconCalculatorFill },
  { label: "Stock", to: ROUTES.CASHIER.STOCK, icon: IconPackage, activeIcon: IconPackageFill },
  { label: "Logs", to: ROUTES.STAFF.LOGS, icon: IconClipboardText, activeIcon: IconClipboardTextFill },
  { label: "Me", to: ROUTES.ME.INDEX, icon: IconUserCircle, activeIcon: IconUserCircleFill },
];
</script>

<template>
  <LayoutOfflineBanner />
  <LayoutShell :items="items" :home="ROUTES.CASHIER.INDEX" />
</template>
