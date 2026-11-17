import { Head } from "@inertiajs/react";
import ComingSoon from "@/components/admin/ComingSoon";
import { adminLayout } from "@/components/admin/AdminLayout";

export default function AdminBitacora() {
  return (
    <>
      <Head title="Bitácora" />
      <ComingSoon title="Bitácora" />
    </>
  );
}

AdminBitacora.layout = adminLayout;
