import { useEffect, type ReactNode } from "react";
import { usePage } from "@inertiajs/react";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PrivacyConsentModal } from "@/components/PrivacyConsentModal";
import type { PageProps } from "@/types";

const SELF_HANDLED_ERRORS = ["Auth/", "Dashboard"];

/** Feeds `flash.success` and the first validation error of each visit into Sonner. */
function FlashToaster() {
  const page = usePage<PageProps & { errors: Record<string, string> }>();
  const { flash, errors } = page.props;

  // Depend on the object identity: each response carries a fresh `flash`, so repeated identical
  // messages still toast.
  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
  }, [flash]);

  // Pages that raise their own destructive toast (title depends on the error) are skipped;
  // everything else surfaces the first validation message here.
  const first = errors ? Object.values(errors)[0] : undefined;
  useEffect(() => {
    if (first && !SELF_HANDLED_ERRORS.some((c) => page.component.startsWith(c))) toast.error(first);
  }, [first, page.component]);

  return null;
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <FlashToaster />
        <PrivacyConsentModal />
        {children}
      </ErrorBoundary>
    </TooltipProvider>
  );
}
