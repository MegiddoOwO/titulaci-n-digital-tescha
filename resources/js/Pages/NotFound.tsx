import { Head, Link, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import PublicShell from "@/components/layout/PublicShell";
import type { PageProps } from "@/types";

const NotFound = () => {
  const { auth } = usePage<PageProps>().props;
  // The 404 for unknown URLs carries no shared props, so signed-in state is only known on some paths.
  const signedIn = Boolean(auth?.user);
  const path = typeof window === "undefined" ? "" : window.location.pathname;

  return (
    <PublicShell widthClass="max-w-5xl">
      <Head title="Página no encontrada" />
      <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-20">
        <h1 className="max-w-[22ch] text-3xl font-extrabold tracking-tight md:text-4xl">No encontramos esta página</h1>
        <p className="mt-4 max-w-[60ch] text-base leading-7 text-muted-foreground">
          Error 404. La dirección{path ? <> <code className="break-all rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">{path}</code></> : null} no existe o
          ya no está disponible. Revisa que esté escrita correctamente o vuelve al inicio; si ya iniciaste sesión, te llevamos a tu panel.
        </p>
        <Button asChild className="mt-8 h-11 px-6 font-semibold">
          {/* "/" sends signed-in users to the home of their role. */}
          <Link href="/">{signedIn ? "Ir a mi panel" : "Ir al inicio"}</Link>
        </Button>
      </div>
    </PublicShell>
  );
};

export default NotFound;
