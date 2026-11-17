import { Head } from "@inertiajs/react";
import ComingSoon from "@/components/admin/ComingSoon";
import { adminLayout } from "@/components/admin/AdminLayout";

export default function AdminArco() {
  return (
    <>
      <Head title="ARCO" />
      <ComingSoon title="ARCO" />
    </>
  );
}

AdminArco.layout = adminLayout;
