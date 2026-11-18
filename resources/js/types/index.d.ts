export interface AuthUser {
    id: number;
    numero_control: string;
    nombre_completo: string;
    nombre: string;
    apellido_paterno: string;
    email: string;
    rol: 'estudiante' | 'asesor' | 'administrativo';
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: AuthUser | null;
        consentimiento: boolean;
    };
    flash: {
        success: string | null;
    };
};
