<script setup lang="ts">
import { IconClipboardText, IconClipboardTextFill, IconUserCircle, IconUserCircleFill } from "@/components";
import { ROUTES } from "@/types";

const items = [
  { label: "Logs", to: ROUTES.STAFF.LOGS, icon: IconClipboardText, activeIcon: IconClipboardTextFill },
  { label: "Me", to: ROUTES.ME.INDEX, icon: IconUserCircle, activeIcon: IconUserCircleFill },
];
</script>

<template>
  <LayoutShell :items="items" :home="ROUTES.STAFF.LOGS" />
</template>
