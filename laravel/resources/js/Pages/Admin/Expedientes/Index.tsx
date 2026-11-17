import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

// Placeholder: the real page is ported in T7. Props are the Express JSON payload.
export default function ExpedienteIndex(props: Record<string, unknown>) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Expedientes (placeholder)</h2>}
        >
            <Head title="Expedientes (placeholder)" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <pre className="overflow-auto bg-white p-6 text-xs text-gray-900 shadow-sm sm:rounded-lg">
                        {JSON.stringify(props, null, 2)}
                    </pre>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
