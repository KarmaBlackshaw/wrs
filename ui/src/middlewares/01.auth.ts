import { ROLE_HOME, ROLE_LABEL, ROUTES, type Middleware } from "@/types";

const PUBLIC_PATHS = new Set<string>([ROUTES.LOGIN]);

let hasRehydrated = false;

const auth: Middleware = async (to) => {
  const isPublic = PUBLIC_PATHS.has(to.path);
  const authStore = useAuthStore();
  const toast = useToast();

  if (!hasRehydrated) {
    hasRehydrated = true;

    if (authStore.token != null && navigator.onLine) {
      try {
        await authStore.fetchMe();
      } catch (error) {
        console.error(error);
      }
    }
  }

  if (!isPublic && (!authStore.isAuthenticated || authStore.activeRole == null)) {
    return { path: ROUTES.LOGIN, query: { redirect: to.fullPath } };
  }

  if (isPublic && authStore.isAuthenticated && authStore.activeRole != null) {
    return ROLE_HOME[authStore.activeRole];
  }

  const requiredRoles = to.meta.roles;

  if (requiredRoles && authStore.activeRole && !requiredRoles.includes(authStore.activeRole)) {
    toast.show(`Not available for ${ROLE_LABEL[authStore.activeRole]}`, "warning");

    return ROLE_HOME[authStore.activeRole];
  }
};

export default auth;
