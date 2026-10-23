import { trips } from "@/mocks/trips";

export function useOpenTrip() {
  const authStore = useAuthStore();

  // ponytail: falls back to any open trip so demo logins always see one; drop the fallback once trips come from the API.
  return computed(
    () => trips.find((trip) => trip.riderId === authStore.user?.id && trip.status === "open") ?? trips.find((trip) => trip.status === "open") ?? null
  );
}
