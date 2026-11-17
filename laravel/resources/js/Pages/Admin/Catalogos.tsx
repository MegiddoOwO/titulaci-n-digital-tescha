import { Head } from "@inertiajs/react";
import ComingSoon from "@/components/admin/ComingSoon";
import { adminLayout } from "@/components/admin/AdminLayout";

export default function AdminCatalogos() {
  return (
    <>
      <Head title="Catálogos" />
      <ComingSoon title="Catálogos" />
    </>
  );
}

AdminCatalogos.layout = adminLayout;
