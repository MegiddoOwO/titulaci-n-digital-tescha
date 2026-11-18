import type { Page } from "@inertiajs/core";
import { useToast } from "@/hooks/use-toast";

/** First server message of an Inertia error bag (validation or a business guard in Spanish). */
export function firstError(errors: Record<string, string>): string {
  return Object.values(errors)[0] ?? "Error desconocido";
}

/**
 * Toasts with the legacy admin shape: a title (usually the server message) and, for errors, the
 * destructive "Error" toast. Pages using it are listed in AppShell's SELF_HANDLED_* so the
 * shared flash toaster does not duplicate them.
 */
export function useAdminToasts() {
  const { toast } = useToast();

  return {
    toast,
    /** Title from `flash.success` of the Inertia response, unless an explicit title is given. */
    success: (page: Page, title?: string, description?: boolean) => {
      const message = (page.props as { flash?: { success?: string | null } }).flash?.success ?? "";
      toast(title ? { title, description: description ? message : undefined } : { title: message });
    },
    failure: (errors: Record<string, string> | string) =>
      toast({
        title: "Error",
        description: typeof errors === "string" ? errors : firstError(errors),
        className: "bg-destructive text-destructive-foreground",
      }),
  };
}
