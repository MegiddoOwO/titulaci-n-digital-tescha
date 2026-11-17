import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

export default function AsesorHome() {
    const { user } = usePage().props.auth;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Panel del asesor
                </h2>
            }
        >
            <Head title="Panel del asesor" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            Sesión iniciada como {user.nombre_completo} ({user.rol}).
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
