<script setup lang="ts">
import { IconTruck, IconTruckFill, IconUserCircle, IconUserCircleFill, IconUsers, IconUsersFill } from "@/components";
import { ROUTES } from "@/types";

const items = [
  { label: "Trips", to: ROUTES.RIDER.INDEX, icon: IconTruck, activeIcon: IconTruckFill },
  { label: "Customers", to: ROUTES.RIDER.CUSTOMERS, icon: IconUsers, activeIcon: IconUsersFill },
  { label: "Me", to: ROUTES.ME.INDEX, icon: IconUserCircle, activeIcon: IconUserCircleFill },
];
</script>

<template>
  <LayoutShell :items="items" :home="ROUTES.RIDER.INDEX" />
</template>
