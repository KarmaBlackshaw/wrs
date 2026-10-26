import { UiConfirmDialog } from "@/components";
import type { TConfirmOptions } from "@/types";

export function useConfirm() {
  const appContext = getCurrentInstance()?.appContext;

  function confirm(options: TConfirmOptions) {
    return new Promise<boolean>((resolve) => {
      const unmount = mountToBody(
        UiConfirmDialog,
        {
          ...options,
          onSettle: (isConfirmed: boolean) => {
            unmount();
            resolve(isConfirmed);
          },
        },
        appContext
      );
    });
  }

  return { confirm };
}
