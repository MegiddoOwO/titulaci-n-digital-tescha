/**
 * Minimal same-origin JSON helper for the endpoints that stay JSON-only (notifications, privacy
 * consent, directory). Uses the session cookie plus Laravel's XSRF-TOKEN cookie; no axios.
 */
function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export async function jsonRequest<T>(url: string, method: 'GET' | 'POST' | 'PUT' = 'GET', body?: unknown): Promise<T> {
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(method !== 'GET' ? { 'X-XSRF-TOKEN': xsrfToken() } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || data.error || 'Error desconocido');
    }

    return data as T;
}

/** Error from a non-2xx response; keeps the status and the parsed body so callers can word it. */
export class HttpError extends Error {
    constructor(
        public status: number,
        public data: Record<string, unknown>,
    ) {
        super(typeof data.message === 'string' ? data.message : 'Error desconocido');
    }
}

/** Multipart POST (file uploads). The browser sets the Content-Type boundary itself. */
export async function postForm<T>(url: string, form: FormData): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: form,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new HttpError(response.status, data && typeof data === 'object' ? data : {});
    }

    return data as T;
}
