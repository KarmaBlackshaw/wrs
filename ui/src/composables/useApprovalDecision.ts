import { IconX } from "@/components";
import type { TConfirmOptions, TReasonActionOptions, TRowAction } from "@/types";

export function useApprovalDecision(reload: () => void) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const reasonPrompt = useReasonPrompt();
  const { run, error } = useAction((call: () => Promise<unknown>) => call(), { inline: ["approval.not_pending"] });

  async function decide(call: () => Promise<unknown>, successMessage: string) {
    await run(call);

    if (error.value?.code === "approval.not_pending") {
      toast.show("Already handled", "info");
      reload();

      return true;
    }

    if (error.value != null) {
      return false;
    }

    toast.show(successMessage);
    reload();

    return true;
  }

  async function confirmThen(options: TConfirmOptions, call: () => Promise<unknown>, successMessage: string) {
    const isConfirmed = await confirmDialog.confirm(options);

    if (isConfirmed) {
      await decide(call, successMessage);
    }
  }

  function reasonAction({ title, confirmLabel, successMessage, submit }: TReasonActionOptions): TRowAction {
    return {
      label: confirmLabel,
      icon: IconX,
      variant: "danger",
      onSelect: () => reasonPrompt.prompt({ title, confirmLabel, submit: (reason) => decide(() => submit(reason), successMessage) }),
    };
  }

  return {
    confirmThen,
    reasonAction,
  };
}
