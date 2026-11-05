import { UiReasonPrompt } from "@/components";
import type { TReasonPromptOptions } from "@/types";

export function useReasonPrompt() {
  const appContext = getCurrentInstance()?.appContext;

  function prompt(options: TReasonPromptOptions) {
    return new Promise<boolean>((resolve) => {
      const unmount = mountToBody(
        UiReasonPrompt,
        {
          ...options,
          onSettle: (isDone: boolean) => {
            unmount();
            resolve(isDone);
          },
        },
        appContext
      );
    });
  }

  return { prompt };
}
