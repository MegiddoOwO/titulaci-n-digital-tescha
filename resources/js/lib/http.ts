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
