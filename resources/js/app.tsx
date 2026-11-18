import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeProvider } from 'next-themes';
import { createRoot } from 'react-dom/client';
import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell';

createInertiaApp({
    title: (title) => (title ? `${title} - Sistema de Titulación ISC` : 'Sistema de Titulación ISC'),
    resolve: async (name) => {
        const page: any = await resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        );

        // Persistent shell (toasts, privacy modal, error boundary) around every page.
        page.default.layout ??= (children: ReactNode) => <AppShell>{children}</AppShell>;

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider attribute="class" defaultTheme="light" storageKey="sca_theme" disableTransitionOnChange>
                <App {...props} />
            </ThemeProvider>,
        );
    },
    progress: {
        color: '#BC955B',
    },
});
