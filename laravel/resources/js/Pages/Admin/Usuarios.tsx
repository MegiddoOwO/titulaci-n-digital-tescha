import { Head } from "@inertiajs/react";
import ComingSoon from "@/components/admin/ComingSoon";
import { adminLayout } from "@/components/admin/AdminLayout";

export default function AdminUsuarios() {
  return (
    <>
      <Head title="Usuarios" />
      <ComingSoon title="Usuarios" />
    </>
  );
}

AdminUsuarios.layout = adminLayout;
