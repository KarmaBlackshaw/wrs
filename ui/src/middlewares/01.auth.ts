import { ROLE_HOME, ROLE_LABEL, ROUTES, type Middleware } from "@/types";

const PUBLIC_PATHS = new Set<string>([ROUTES.LOGIN]);

const auth: Middleware = (to) => {
  const isPublic = PUBLIC_PATHS.has(to.path);
  const authStore = useAuthStore();
  const toast = useToast();

  if (!isPublic && !authStore.isAuthenticated) {
    return { path: ROUTES.LOGIN, query: { redirect: to.fullPath } };
  }

  if (isPublic && authStore.isAuthenticated && authStore.activeRole) {
    return ROLE_HOME[authStore.activeRole];
  }

  const requiredRoles = to.meta.roles;

  if (requiredRoles && authStore.activeRole && !requiredRoles.includes(authStore.activeRole)) {
    toast.show(`Not available for ${ROLE_LABEL[authStore.activeRole]}`, "warning");

    return ROLE_HOME[authStore.activeRole];
  }
};

export default auth;
