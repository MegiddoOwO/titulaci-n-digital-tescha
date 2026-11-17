import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        numero_control: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Recuperar contraseña" />

            <div className="mb-4 text-sm text-gray-600">
                Ingresa tu número de control y te enviaremos un enlace para
                restablecer tu contraseña.
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <InputLabel htmlFor="numero_control" value="Número de control" />

                <TextInput
                    id="numero_control"
                    type="text"
                    name="numero_control"
                    value={data.numero_control}
                    className="mt-1 block w-full"
                    isFocused={true}
                    onChange={(e) => setData('numero_control', e.target.value)}
                />

                <InputError message={errors.numero_control} className="mt-2" />

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="text-sm text-gray-600 underline hover:text-gray-900"
                    >
                        Volver al inicio de sesión
                    </Link>
                    <PrimaryButton className="ms-4" disabled={processing}>
                        Enviar enlace
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
