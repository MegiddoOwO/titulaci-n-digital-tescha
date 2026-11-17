export interface AuthUser {
    id: number;
    numero_control: string;
    nombre_completo: string;
    rol: 'estudiante' | 'asesor' | 'administrativo';
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: AuthUser;
        consentimiento: boolean;
    };
};
